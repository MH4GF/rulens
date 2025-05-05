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

    // In ESLint, ruleName is in the format like 'no-console', and
    // for plugins, it's like '@typescript-eslint/no-explicit-any'
    const fullRuleId = categoryName === 'ESLint Core' ? ruleName : `${categoryName}/${ruleName}`

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
 * Categorize ESLint rules by category
 */
function categorizeESLintRules(
  rules: Record<string, unknown>,
): Record<string, Record<string, unknown>> {
  const categorized: Record<string, Record<string, unknown>> = {}

  for (const [ruleId, ruleConfig] of Object.entries(rules)) {
    // Determine if it's a plugin rule or core rule
    let category: string
    let ruleName: string

    if (ruleId.includes('/')) {
      // Plugin rule (e.g., '@typescript-eslint/no-explicit-any')
      const parts = ruleId.split('/')
      if (parts.length >= 2) {
        category = parts[0] || 'ESLint Core'
        ruleName = parts[1] || ruleId
      } else {
        // Fallback
        category = 'ESLint Core'
        ruleName = ruleId
      }
    } else {
      // Core rule (e.g., 'no-console')
      category = 'ESLint Core'
      ruleName = ruleId
    }

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
