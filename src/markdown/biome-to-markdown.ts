import type { BiomeRageResult } from '../tools/biome-runner.ts'

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

    if (!categorizedRules[category]) {
      categorizedRules[category] = []
    }

    categorizedRules[category].push(ruleName)
  }

  return categorizedRules
}

/**
 * Converts a category and its rules to a markdown section
 */
export function biomeCategoryToMarkdown(category: string, rules: string[]): string {
  let markdown = `### ${category}\n\n`

  if (rules.length > 0) {
    for (const rule of rules) {
      markdown += `- \`${rule}\`\n`
    }
  }

  return markdown
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
