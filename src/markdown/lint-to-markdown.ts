import type { RulensCategory, RulensLinter, RulensRule } from '../types/rulens.ts'

/**
 * Descriptions by category
 */
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  // Biome categories
  accessibility:
    'Rules in this category ensure that code is accessible to all users, including those using assistive technologies.',
  complexity:
    'Rules in this category help maintain code that is easy to understand, modify, and debug by limiting complexity.',
  correctness:
    'Rules in this category identify code that is likely to be incorrect or lead to bugs.',
  nursery: 'Newer rules that are still being refined based on community feedback.',
  performance: 'Rules in this category help improve application and runtime performance.',
  security: 'Rules in this category identify security vulnerabilities that could be exploited.',
  style: 'Rules in this category enforce consistent code style and patterns.',
  suspicious: 'Rules in this category identify potentially problematic code patterns.',
}

/**
 * Linter descriptions
 */
const LINTER_DESCRIPTIONS: Record<string, string> = {
  Biome:
    'Biome enforces modern JavaScript/TypeScript best practices with a focus on correctness, maintainability, and performance.',
  ESLint:
    'ESLint provides static analysis focused on identifying potential errors and enforcing coding standards.',
}

/**
 * Section icons
 */
const SECTION_ICONS: Record<string, string> = {
  introduction: '📖',
  'ai-usage-guide': '🤖',
  'biome-rules': '🔧',
  'eslint-rules': '🔧',
  'table-of-contents': '📑',
  'document-overview': '📋',
}

/**
 * Generate markdown from common intermediate representation
 * @param linter Linter information
 * @param useEnhancedFormat Whether to use enhanced format (set to false for testing)
 */
export function lintRulesToMarkdown(linter: RulensLinter, useEnhancedFormat = false): string {
  const { name, categories } = linter

  // Sort categories alphabetically (as a precaution, even if they're already sorted)
  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name))

  // Use simple format for testing
  let markdown = useEnhancedFormat
    ? `## ${SECTION_ICONS[`${linter.name.toLowerCase()}-rules`] || '🔧'} ${name} Rules\n\n`
    : `## ${name} Rules\n\n`

  if (categories.length === 0) {
    markdown += 'No rules enabled.\n'
    return markdown
  }

  // Add linter description (enhanced format only)
  if (useEnhancedFormat) {
    const linterDescription = LINTER_DESCRIPTIONS[name]
    if (linterDescription) {
      markdown += `${linterDescription}\n\n`
    }
  }

  for (const category of sortedCategories) {
    markdown += categoryToMarkdown(category, useEnhancedFormat, name)

    // Add separator for all categories except the last one
    if (category !== sortedCategories[sortedCategories.length - 1]) {
      if (useEnhancedFormat) {
        markdown += '---\n\n'
      } else {
        markdown += '\n'
      }
    }
  }

  return markdown
}

/**
 * Convert category to markdown
 */
function categoryToMarkdown(
  category: RulensCategory,
  useEnhancedFormat = false,
  linterName = '',
): string {
  let markdown = `### ${category.name}\n\n`

  if (category.rules.length === 0) {
    markdown += 'No rules in this category.\n'
    return markdown
  }

  // Add category description (enhanced format only, priority: specified description > predefined description)
  if (useEnhancedFormat) {
    const description = category.description || CATEGORY_DESCRIPTIONS[category.name]
    if (description) {
      markdown += `${description}\n\n`
    }
  }

  // Sort rules alphabetically
  const sortedRules = [...category.rules].sort((a, b) => a.name.localeCompare(b.name))

  if (useEnhancedFormat) {
    // Enhanced format: table format
    markdown += '| Rule | Description | Options |\n'
    markdown += '| ---- | ----------- | ------- |\n'

    // Display rules in table format
    for (const rule of sortedRules) {
      markdown += ruleToMarkdownTableRow(rule, linterName)
    }
  } else {
    // Normal format: list format (for testing)
    for (const rule of sortedRules) {
      markdown += ruleToMarkdownListItem(rule, linterName)
    }
  }

  markdown += '\n'
  return markdown
}

/**
 * Format options as a string for display
 */
function formatOptions(options: unknown): string {
  if (!options) {
    return ''
  }

  try {
    // Always use JSON.stringify for all types to avoid stringification issues
    return JSON.stringify(options)
  } catch {
    // Fallback if JSON conversion fails
    return 'Complex options'
  }
}

/**
 * Convert rule to markdown table row (for enhanced format)
 */
function ruleToMarkdownTableRow(rule: RulensRule, linterName = ''): string {
  // Build display for severity
  const metadataText = buildRuleMetadataText(rule, linterName)

  // Rule name and URL
  let ruleName = rule.name
  if (rule.url) {
    ruleName = `[\`${rule.name}\`](${rule.url})`
  } else {
    ruleName = `\`${rule.name}\``
  }

  // Description and severity
  let description = rule.description
  if (metadataText) {
    description += ` ${metadataText}`
  }

  // Format options
  const optionsText = formatOptions(rule.options)

  return `| ${ruleName} | ${description} | ${optionsText} |\n`
}

/**
 * Convert rule to markdown list item (for test compatibility)
 */
function ruleToMarkdownListItem(rule: RulensRule, linterName = ''): string {
  // Build display for severity
  const metadataText = buildRuleMetadataText(rule, linterName)

  // Display with link if URL exists
  let line = ''
  if (rule.url) {
    line = `- [\`${rule.name}\`](${rule.url}): ${rule.description}`
  } else {
    line = `- \`${rule.name}\`: ${rule.description}`
  }

  // Add severity if it exists
  if (metadataText) {
    line += ` ${metadataText}`
  }

  // Add options if they exist
  if (rule.options) {
    const optionsText = formatOptions(rule.options)
    line += ` Options: ${optionsText}`
  }

  return `${line}\n`
}

/**
 * Generate rule metadata (severity) as a string
 * ESLint rules will not display severity as specified in the requirements
 */
function buildRuleMetadataText(rule: RulensRule, linterName = ''): string {
  // If this is an ESLint rule, don't display severity
  if (linterName === 'ESLint') {
    return ''
  }

  // Add severity if it exists for non-ESLint rules
  if (rule.severity) {
    return `(${rule.severity})`
  }

  return ''
}
