import type { ESLintConfigResult } from '../tools/eslint-runner.ts'
import type { RulensCategory, RulensLinter, RulensRule } from '../types/rulens.ts'
import { Logger } from '../utils/logger.ts'

const logger = new Logger()

/**
 * Convert ESLint execution results to common intermediate representation
 */
export function parseESLintRules(eslintResult: ESLintConfigResult): RulensLinter {
  const { rules, rulesMeta } = eslintResult

  if (!rules || Object.keys(rules).length === 0) {
    return {
      name: 'ESLint',
      categories: [],
    }
  }

  // Categorize rules
  const categorizedRules = categorizeESLintRules(rules)

  /**
   * Convert rules for each category
   */
  function createRulensRule(
    ruleName: string,
    ruleConfig: unknown,
    categoryName: string,
  ): RulensRule {
    const { severity, options } = parseRuleConfig(ruleConfig)

    // Build the full rule ID based on the category
    let fullRuleId: string
    if (categoryName === 'ESLint Core') {
      // Core rule: just use the name
      fullRuleId = ruleName
    } else if (categoryName.startsWith('@') && categoryName.split('/').length > 1) {
      // Double namespace plugin (e.g., @next/next): use the full pattern
      fullRuleId = `${categoryName}/${ruleName}`
    } else {
      // Standard plugin: combine category and rule name
      fullRuleId = `${categoryName}/${ruleName}`
    }

    // Get description and URL from rule metadata
    const ruleMeta = rulesMeta[fullRuleId]
    const description = ruleMeta?.description || `ESLint rule: ${ruleName}`
    const url = ruleMeta?.url

    return {
      id: fullRuleId,
      name: ruleName,
      description,
      url: url || '',
      severity: severity || 'unknown', // Ensure severity is never undefined
      ...(options ? { options } : {}),
    }
  }

  /**
   * Get category description
   */
  function getCategoryDescription(categoryName: string): string | undefined {
    // Get description from pluginsMetadata
    if (eslintResult.pluginsMetadata?.[categoryName]) {
      return eslintResult.pluginsMetadata[categoryName].description
    }

    // Fallback descriptions for when plugin metadata is not found
    // Descriptions for commonly used ESLint plugins
    const fallbackDescriptions: Record<string, string> = {
      '@typescript-eslint':
        'Rules in this category enforce TypeScript-specific best practices and type safety.',
      'ESLint Core': 'Core ESLint rules that apply to JavaScript code.',
      'unused-imports':
        'Rules that prevent unused imports and variables from cluttering your code.',
      vitest: 'Rules that ensure effective testing practices when using Vitest.',
      '@next/next':
        'Rules specific to Next.js applications that enforce best practices and prevent common issues.',
      import: 'Rules that help verify proper imports and prevent issues with importing modules.',
      react: 'Rules for React-specific code quality and best practices.',
      'react-hooks': 'Rules that enforce the Rules of Hooks and other React Hooks best practices.',
    }

    return fallbackDescriptions[categoryName]
  }

  /**
   * Generate RulensCategory for each category
   */
  function createRulensCategory(categoryName: string): RulensCategory {
    const rulesInCategory = categorizedRules[categoryName]
    // Check if rulesInCategory is defined
    if (!rulesInCategory) {
      return {
        name: categoryName,
        rules: [],
      }
    }

    // Convert rules in this category, filtering out those with "off" severity
    const categoryRules = Object.entries(rulesInCategory)
      .map(([ruleName, ruleConfig]) => {
        const { severity } = parseRuleConfig(ruleConfig)
        // Skip rules with "off" severity
        if (severity === 'off') {
          return null
        }
        return createRulensRule(ruleName, ruleConfig, categoryName)
      })
      .filter((rule): rule is RulensRule => rule !== null)

    // Get description for this category
    const description = getCategoryDescription(categoryName)

    logger.debug(`Category: ${categoryName}, Description: ${description || 'none'}`)

    return {
      name: categoryName,
      ...(description ? { description } : {}),
      rules: categoryRules,
    }
  }

  // Sort categories alphabetically
  const categories = Object.keys(categorizedRules).sort().map(createRulensCategory)

  return {
    name: 'ESLint',
    categories,
  }
}

/**
 * Parse a rule ID to determine its category and rule name
 */
function parseRuleId(ruleId: string): { category: string; ruleName: string } {
  // If rule doesn't include '/', it's a core rule
  if (!ruleId.includes('/')) {
    return {
      category: 'ESLint Core',
      ruleName: ruleId,
    }
  }

  // Handle rules with different namespace patterns
  const parts = ruleId.split('/')

  // Handle double namespace pattern like @next/next/rule-name (parts.length >= 3)
  if (parts.length >= 3 && parts[0]?.startsWith('@') && parts[1] !== undefined) {
    const lastPart = parts[parts.length - 1]
    // For rules like @next/next/no-img-element, we want category as @next/next
    return {
      category: `${parts[0]}/${parts[1]}`,
      ruleName: lastPart !== undefined ? lastPart : ruleId,
    }
  }

  // Standard plugin rule (e.g., '@typescript-eslint/no-explicit-any')
  if (parts.length >= 2) {
    return {
      category: parts[0] || 'ESLint Core',
      ruleName: parts[1] || ruleId,
    }
  }

  // Fallback for any edge cases
  return {
    category: 'ESLint Core',
    ruleName: ruleId,
  }
}

/**
 * Categorize ESLint rules by category
 */
function categorizeESLintRules(
  rules: Record<string, unknown>,
): Record<string, Record<string, unknown>> {
  const categorized: Record<string, Record<string, unknown>> = {}

  for (const [ruleId, ruleConfig] of Object.entries(rules)) {
    // Parse the rule ID to get category and rule name
    const { category, ruleName } = parseRuleId(ruleId)

    // Initialize category and add rules
    const categoryRules = categorized[category] ?? {}
    categoryRules[ruleName] = ruleConfig
    categorized[category] = categoryRules
  }

  return categorized
}

/**
 * Parse severity and options from ESLint rule configuration
 */
function parseRuleConfig(config: unknown): { severity: string; options?: unknown } {
  // String format (e.g., 'error', 'warn', 'off')
  if (typeof config === 'string') {
    return { severity: config }
  }

  // Numeric format (e.g., 0, 1, 2)
  if (typeof config === 'number') {
    return { severity: convertNumericSeverity(config) }
  }

  // Array format (e.g., ['error', { option1: true }])
  if (Array.isArray(config) && config.length > 0) {
    // Treat the first element as severity
    const severityValue: unknown = config[0]
    const optionsValues = config.slice(1)

    // Convert numeric or string severity to string type
    const severity =
      typeof severityValue === 'number'
        ? convertNumericSeverity(severityValue)
        : typeof severityValue === 'string'
          ? severityValue
          : 'unknown'

    return {
      severity,
      options: optionsValues.length === 1 ? optionsValues[0] : optionsValues,
    }
  }

  // Return default value for unknown formats
  return { severity: 'unknown' }
}

/**
 * Convert numeric severity to string
 */
function convertNumericSeverity(value: number): string {
  switch (value) {
    case 0:
      return 'off'
    case 1:
      return 'warn'
    case 2:
      return 'error'
    default:
      return 'unknown'
  }
}
