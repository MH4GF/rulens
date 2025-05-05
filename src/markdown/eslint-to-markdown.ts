import type { ESLintConfigResult } from '../tools/eslint-runner.ts'

type ESLintRules = Record<string, unknown>

/**
 * Categorizes ESLint rules into a map of categories to rule names
 * Rules are categorized by plugin (e.g. '@typescript-eslint', 'react')
 * or ESLint Core for built-in rules
 */
export function eslintRulesToCategorizedMap(rules: ESLintRules): Record<string, string[]> {
  const categorizedRules: Record<string, string[]> = {}

  for (const ruleName of Object.keys(rules)) {
    let category: string
    let shortRuleName: string

    if (ruleName.includes('/')) {
      // Plugin rule, format: 'plugin/rule-name'
      const parts = ruleName.split('/')
      if (parts.length >= 2 && parts[0] !== undefined && parts[1] !== undefined) {
        category = parts[0]
        shortRuleName = parts[1]
      } else {
        // Fallback for unexpected format
        category = 'ESLint Core'
        shortRuleName = ruleName
      }
    } else {
      // Core rule
      category = 'ESLint Core'
      shortRuleName = ruleName
    }

    if (category && shortRuleName) {
      if (!categorizedRules[category]) {
        categorizedRules[category] = []
      }

      // We know this exists since we just checked and initialized it
      const arr = categorizedRules[category]
      if (arr) {
        arr.push(shortRuleName)
      }
    }
  }

  return categorizedRules
}

/**
 * Formats an ESLint rule severity level for display
 */
function formatRuleSeverity(rule: unknown): string {
  if (rule === 'error' || rule === 2) {
    return 'error'
  }
  if (rule === 'warn' || rule === 1) {
    return 'warn'
  }
  if (rule === 'off' || rule === 0) {
    return 'off'
  }

  if (Array.isArray(rule) && rule.length > 0) {
    // Process in a type-safe way without direct index access
    const hasOptions = rule.length > 1
    return `${formatRuleSeverity(Array.isArray(rule) ? rule[0] : undefined)}${hasOptions ? ' (with options)' : ''}`
  }

  return 'unknown'
}

/**
 * Converts a category and its rules to a markdown section
 */
export function eslintCategoryToMarkdown(category: string, rules: Record<string, unknown>): string {
  let markdown = `### ${category}\n\n`

  // Sort rule names alphabetically for consistent output
  const ruleNames = Object.keys(rules).sort()
  if (ruleNames.length > 0) {
    for (const ruleName of ruleNames) {
      const severity = formatRuleSeverity(rules[ruleName])
      markdown += `- \`${ruleName}\`: ${severity}\n`
    }
  }

  return markdown
}

/**
 * Converts an ESLintConfigResult to a markdown string
 */
export function eslintRulesToMarkdown(eslintResult: ESLintConfigResult): string {
  const { rules } = eslintResult
  let markdown = '## ESLint Rules\n\n'

  if (Object.keys(rules).length === 0) {
    markdown += 'No rules enabled.\n'
    return markdown
  }

  // Get categorized rules
  const categorizedMap = eslintRulesToCategorizedMap(rules)

  // Create rule object for each category
  const categoryRules: Record<string, Record<string, unknown>> = {}
  for (const [category, ruleNames] of Object.entries(categorizedMap)) {
    categoryRules[category] = {}

    for (const ruleName of ruleNames) {
      // Determine the full rule name to look up in the original rules object
      const fullRuleName = category === 'ESLint Core' ? ruleName : `${category}/${ruleName}`
      categoryRules[category][ruleName] = rules[fullRuleName]
    }
  }

  // Sort categories alphabetically
  const sortedCategories = Object.keys(categoryRules).sort()

  for (const category of sortedCategories) {
    const rules = categoryRules[category] || {}
    markdown += eslintCategoryToMarkdown(category, rules)
    if (category !== sortedCategories[sortedCategories.length - 1]) {
      markdown += '\n'
    }
  }

  return markdown
}
