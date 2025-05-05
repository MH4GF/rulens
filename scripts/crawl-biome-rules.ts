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
 * 表のセルからルール情報を抽出する
 */
function extractRuleInfo(
  $: CheerioAPI,
  cells: Node[],
  categoryName: string,
): { ruleId: string; description: string; url?: string | undefined } | null {
  const ruleNameCell = $(cells[0])
  const descriptionCell = $(cells[1])

  // ルール名を取得 (リンクの中にある場合が多い)
  const ruleLink = ruleNameCell.find('a')
  const ruleName = (ruleLink.length > 0 ? ruleLink.text() : ruleNameCell.text()).trim()
  const description = descriptionCell.text().trim()

  if (!(ruleName && description)) {
    return null
  }

  // ルールの詳細ページURLを取得 (存在する場合)
  let url: string | undefined
  if (ruleLink.length > 0) {
    const href = ruleLink.attr('href')
    if (href?.startsWith('/linter/rules/')) {
      url = `${BASE_URL}${href}`
    }
  }

  // Biomeの命名規則に合わせてキャメルケースに変換
  const camelCaseRuleName = convertToCamelCase(ruleName)

  // カテゴリ名のマッピング
  // 特に "Accessibility" は Biome CLI では "a11y" として認識されるため調整
  // カテゴリ名は先頭大文字に統一する
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
 * 指定されたカテゴリのテーブルからルール情報を抽出する
 */
function extractRulesFromTable(
  $: CheerioAPI,
  table: Node,
  categoryName: string,
): { ruleId: string; description: string; url?: string | undefined }[] {
  const result: { ruleId: string; description: string; url?: string | undefined }[] = []

  // テーブル内の各ルール行を処理
  const rows = $(table).find('tr').toArray()

  // ヘッダー行をスキップ (インデックス0)
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex]
    const cells = $(row).find('td').toArray()

    if (cells.length < 2) {
      continue
    }

    // ルール情報を解析
    const ruleInfo = extractRuleInfo($, cells, categoryName)
    if (ruleInfo) {
      result.push(ruleInfo)
    }
  }

  return result
}

/**
 * HTMLからカテゴリとテーブルの対応関係を抽出する
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
 * Biomeルール一覧ページから直接ルール情報を抽出する
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
 * ダッシュ区切りの文字列をキャメルケースに変換
 * 例: "no-autofocus" → "noAutofocus"
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
 * メイン処理
 */
async function main(): Promise<void> {
  try {
    // ルール情報を一括抽出
    const descriptions = await extractRuleInformation()
    await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true })
    await fs.writeFile(OUTPUT_PATH, JSON.stringify(descriptions, null, 2), 'utf8')
  } catch {
    // エラーの場合は終了
    process.exit(1)
  }
}

// スクリプトを実行
main().catch((_error) => {
  process.exit(1)
})
