import biomeRuleDescriptionsData from '../data/biome-rules.json' with { type: 'json' }
import type { BiomeRageResult } from '../tools/biome-runner.ts'
import type { BiomeRuleDescription } from '../types/biome-rules.js'

// Import JSON file
const biomeRuleDescriptions: BiomeRuleDescription =
  biomeRuleDescriptionsData as BiomeRuleDescription

/**
 * Categorizes an array of Biome rules into a map of categories to rule names
 */
export function biomeRulesToCategorizedMap(rules: string[]): Record<string, string[]> {
  const categorizedRules: Record<string, string[]> = {}

  for (const rule of rules) {
    const parts = rule.split('/')
    if (parts.length !== 2) {
      continue
    }

    const [category, ruleName] = parts

    if (category === undefined || ruleName === undefined) {
      continue
    }

    // Map 'a11y' category to 'accessibility' to match both the JSON keys and UI conventions
    const normalizedCategory = category === 'a11y' ? 'accessibility' : category

    if (!categorizedRules[normalizedCategory]) {
      categorizedRules[normalizedCategory] = []
    }

    categorizedRules[normalizedCategory].push(ruleName)
  }

  return categorizedRules
}

/**
 * Convert category name to JSON format
 */
function normalizeCategory(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1)
}

/**
 * Generate appropriate markdown display from rule information
 */
function formatRuleMarkdown(ruleName: string, description: string, url: string): string {
  if (description) {
    if (url) {
      // If both description and URL exist, display with link
      return `- [\`${ruleName}\`](${url}): ${description}\n`
    }
    // If only description exists
    return `- \`${ruleName}\`: ${description}\n`
  }
  // If no description, display only rule name
  return `- \`${ruleName}\`\n`
}

/**
 * Converts a category and its rules to a markdown section
 */
export function biomeCategoryToMarkdown(category: string, rules: string[]): string {
  let markdown = `### ${category}\n\n`

  if (rules.length > 0) {
    // Sort rule names alphabetically
    const sortedRules = [...rules].sort()

    for (const ruleName of sortedRules) {
      // Build rule ID (category/ruleName format)
      const camelCaseRuleName = convertToCamelCase(ruleName)

      // Category name mapping in JSON file
      // Special handling for "a11y" - map category correctly
      const jsonCategory = category === 'accessibility' ? 'a11y' : normalizeCategory(category)

      const ruleId = `${jsonCategory}/${camelCaseRuleName}`

      // Add description and URL if available
      const ruleInfo = biomeRuleDescriptions[ruleId]
      const description = ruleInfo?.description || ''
      const url = ruleInfo?.url || ''

      // Add markdown output
      markdown += formatRuleMarkdown(ruleName, description, url || '')
    }
  }

  return markdown
}

/**
 * Convert dash-separated string to camelCase
 * Example: "no-autofocus" → "noAutofocus"
 */
function convertToCamelCase(str: string): string {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Converts a BiomeRageResult to a markdown string
 */
export function biomeRulesToMarkdown(biomeResult: BiomeRageResult): string {
  const { rules } = biomeResult
  let markdown = '## Biome Rules\n\n'

  if (rules.length === 0) {
    markdown += 'No rules enabled.\n'
    return markdown
  }

  const categorizedRules = biomeRulesToCategorizedMap(rules)

  // Sort categories alphabetically
  const sortedCategories = Object.keys(categorizedRules).sort()

  for (const category of sortedCategories) {
    const rules = categorizedRules[category] || []
    markdown += biomeCategoryToMarkdown(category, rules)
    if (category !== sortedCategories[sortedCategories.length - 1]) {
      markdown += '\n'
    }
  }

  return markdown
}
