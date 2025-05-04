import biomeRuleDescriptionsData from '../data/biome-rules.json' with { type: 'json' }
import type { BiomeRageResult } from '../tools/biome-runner.ts'
import type { BiomeRuleDescription } from '../types/biome-rules.js'

// JSONファイルをインポート
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
 * カテゴリ名をJSON用の形式に変換する
 */
function normalizeCategory(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1)
}

/**
 * ルール情報から適切なマークダウン表示を生成
 */
function formatRuleMarkdown(ruleName: string, description: string, url: string): string {
  if (description) {
    if (url) {
      // 説明文とURLの両方がある場合はリンク付きで表示
      return `- [\`${ruleName}\`](${url}): ${description}\n`
    }
    // 説明文のみある場合
    return `- \`${ruleName}\`: ${description}\n`
  }
  // 説明文がない場合はルール名のみ表示
  return `- \`${ruleName}\`\n`
}

/**
 * Converts a category and its rules to a markdown section
 */
export function biomeCategoryToMarkdown(category: string, rules: string[]): string {
  let markdown = `### ${category}\n\n`

  if (rules.length > 0) {
    // ルール名をアルファベット順にソート
    const sortedRules = [...rules].sort()

    for (const ruleName of sortedRules) {
      // ルールIDを構築（カテゴリー/ルール名 形式）
      const camelCaseRuleName = convertToCamelCase(ruleName)

      // JSONファイルでのカテゴリ名マッピング
      // "a11y"を特別に扱う - カテゴリーを正しくマッピングする
      const jsonCategory = category === 'accessibility' ? 'a11y' : normalizeCategory(category)

      const ruleId = `${jsonCategory}/${camelCaseRuleName}`

      // 説明文とURLがあれば追加する
      const ruleInfo = biomeRuleDescriptions[ruleId]
      const description = ruleInfo?.description || ''
      const url = ruleInfo?.url || ''

      // マークダウン出力を追加
      markdown += formatRuleMarkdown(ruleName, description, url || '')
    }
  }

  return markdown
}

/**
 * ダッシュ区切りの文字列をキャメルケースに変換
 * 例: "no-autofocus" → "noAutofocus"
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
