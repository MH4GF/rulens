#!/usr/bin/env tsx

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { load } from 'cheerio'
import type { CheerioAPI } from 'cheerio'
import type { BiomeRuleDescription } from '../src/types/biome-rules.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE_URL = 'https://biomejs.dev'
const RULES_INDEX_URL = `${BASE_URL}/linter/rules/`
const OUTPUT_PATH = path.resolve(__dirname, '../src/data/biome-rules.json')

type Node = ReturnType<CheerioAPI>[0]

/**
 * Extract rule information from table cells
 */
function extractRuleInfo(
  $: CheerioAPI,
  cells: Node[],
  categoryName: string,
): { ruleId: string; description: string; url?: string | undefined } | null {
  const ruleNameCell = $(cells[0])
  const descriptionCell = $(cells[1])

  // Get rule name (often inside a link)
  const ruleLink = ruleNameCell.find('a')
  const ruleName = (ruleLink.length > 0 ? ruleLink.text() : ruleNameCell.text()).trim()
  const description = descriptionCell.text().trim()

  if (!(ruleName && description)) {
    return null
  }

  // Get the rule detail page URL (if it exists)
  let url: string | undefined
  if (ruleLink.length > 0) {
    const href = ruleLink.attr('href')
    if (href?.startsWith('/linter/rules/')) {
      url = `${BASE_URL}${href}`
    }
  }

  // Convert to camelCase according to Biome naming conventions
  const camelCaseRuleName = convertToCamelCase(ruleName)

  // Category name mapping
  // Particularly, "Accessibility" is recognized as "a11y" in Biome CLI, so adjust
  // Standardize category names to start with a capital letter
  let jsonCategoryName = categoryName
  if (categoryName.toLowerCase() === 'accessibility') {
    jsonCategoryName = 'a11y'
  }

  const ruleId = `${jsonCategoryName}/${camelCaseRuleName}`

  return {
    ruleId,
    description,
    url,
  }
}

/**
 * Extract rule information from a table for the specified category
 */
function extractRulesFromTable(
  $: CheerioAPI,
  table: Node,
  categoryName: string,
): { ruleId: string; description: string; url?: string | undefined }[] {
  const result: { ruleId: string; description: string; url?: string | undefined }[] = []

  // Process each rule row in the table
  const rows = $(table).find('tr').toArray()

  // Skip header row (index 0)
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex]
    const cells = $(row).find('td').toArray()

    if (cells.length < 2) {
      continue
    }

    // Parse rule information
    const ruleInfo = extractRuleInfo($, cells, categoryName)
    if (ruleInfo) {
      // Escape special characters in description to prevent breaking Markdown rendering
      ruleInfo.description = escapeMarkdownSpecialChars(ruleInfo.description)
      result.push(ruleInfo)
    }
  }

  return result
}

/**
 * Extract categories and tables relationship from HTML
 */
function extractCategoriesAndTables($: CheerioAPI): {
  categories: string[]
  tables: Node[]
} {
  // Get all H2 elements and tables in order
  const h2Elements = $('.sl-markdown-content h2').toArray()
  const tables = $('.sl-markdown-content table').toArray()

  // Extract category names
  const categories = h2Elements
    .map((el) => $(el).text().trim())
    .filter((text) => text && text !== 'Rules')

  return { categories, tables }
}

/**
 * Extract rule information directly from Biome rule list page
 */
async function extractRuleInformation(): Promise<BiomeRuleDescription> {
  const descriptions: BiomeRuleDescription = {}

  // Fetch and parse HTML
  const response = await fetch(RULES_INDEX_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch rules list: ${response.status} ${response.statusText}`)
  }

  const html = await response.text()
  const $ = load(html)

  // Get categories and tables
  const { categories, tables } = extractCategoriesAndTables($)

  // Process tables - assuming they appear in the same order as categories
  for (let i = 0; i < Math.min(categories.length, tables.length); i++) {
    const categoryName = categories[i]
    if (!categoryName) {
      continue
    }

    const table = tables[i]
    if (!table) {
      continue
    }

    // Extract rules from this category's table
    const rulesInCategory = extractRulesFromTable($, table, categoryName)

    // Add rules to result
    for (const rule of rulesInCategory) {
      descriptions[rule.ruleId] = {
        description: rule.description,
        ...(rule.url !== undefined ? { url: rule.url } : {}),
      }
    }
  }

  return descriptions
}

/**
 * Escape special Markdown characters in a string to prevent rendering issues
 */
function escapeMarkdownSpecialChars(str: string): string {
  return str
    .replace(/</g, '\\<')
    .replace(/>/g, '\\>')
    .replace(/\|/g, '\\|')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/`/g, '\\`')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/-/g, '\\-')
    .replace(/\./g, '\\.')
    .replace(/!/g, '\\!')
}

/**
 * Convert dash-separated string to camelCase
 * Example: "no-autofocus" → "noAutofocus"
 */
function convertToCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => {
    if (typeof letter === 'string') {
      return letter.toUpperCase()
    }
    return ''
  })
}

/**
 * Main process
 */
async function main(): Promise<void> {
  try {
    // Extract all rule information at once
    const descriptions = await extractRuleInformation()
    await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true })
    await fs.writeFile(OUTPUT_PATH, JSON.stringify(descriptions, null, 2), 'utf8')
  } catch {
    // Exit in case of error
    process.exit(1)
  }
}

// Execute the script
main().catch((_error) => {
  process.exit(1)
})
