import type { RulensCategory, RulensLinter, RulensRule } from '../types/rulens.ts'

/**
 * カテゴリー別の説明文
 */
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  // Biomeカテゴリ
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

  // ESLintカテゴリ
  '@typescript-eslint':
    'Rules in this category enforce TypeScript-specific best practices and type safety.',
  'ESLint Core': 'Core ESLint rules that apply to JavaScript code.',
  'unused-imports': 'Rules that prevent unused imports and variables from cluttering your code.',
  vitest: 'Rules that ensure effective testing practices when using Vitest.',
}

/**
 * Linterの説明文
 */
const LINTER_DESCRIPTIONS: Record<string, string> = {
  Biome:
    'Biome enforces modern JavaScript/TypeScript best practices with a focus on correctness, maintainability, and performance.',
  ESLint:
    'ESLint provides static analysis focused on identifying potential errors and enforcing coding standards.',
}

/**
 * セクションアイコン
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
 * 共通中間表現からマークダウンを生成する
 * @param linter リンター情報
 * @param useEnhancedFormat 拡張フォーマットを使用するかどうか (テスト時はfalseにする)
 */
export function lintRulesToMarkdown(linter: RulensLinter, useEnhancedFormat = false): string {
  const { name, categories } = linter

  // カテゴリをアルファベット順にソート（すでにソート済みでも念のため）
  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name))

  // テスト時はシンプルな形式を使用
  let markdown = useEnhancedFormat
    ? `## ${SECTION_ICONS[`${linter.name.toLowerCase()}-rules`] || '🔧'} ${name} Rules\n\n`
    : `## ${name} Rules\n\n`

  if (categories.length === 0) {
    markdown += 'No rules enabled.\n'
    return markdown
  }

  // Linterの説明文を追加（拡張フォーマット時のみ）
  if (useEnhancedFormat) {
    const linterDescription = LINTER_DESCRIPTIONS[name]
    if (linterDescription) {
      markdown += `${linterDescription}\n\n`
    }
  }

  for (const category of sortedCategories) {
    markdown += categoryToMarkdown(category, useEnhancedFormat)

    // 最後のカテゴリ以外で区切りを追加
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
 * カテゴリをマークダウンに変換
 */
function categoryToMarkdown(category: RulensCategory, useEnhancedFormat = false): string {
  let markdown = `### ${category.name}\n\n`

  if (category.rules.length === 0) {
    markdown += 'No rules in this category.\n'
    return markdown
  }

  // カテゴリ説明を追加（拡張フォーマット時のみ、優先順位: 指定された説明 > 定義済み説明）
  if (useEnhancedFormat) {
    const description = category.description || CATEGORY_DESCRIPTIONS[category.name]
    if (description) {
      markdown += `${description}\n\n`
    }
  }

  // ルールをアルファベット順にソート
  const sortedRules = [...category.rules].sort((a, b) => a.name.localeCompare(b.name))

  if (useEnhancedFormat) {
    // 拡張フォーマット: テーブル形式
    markdown += '| Rule | Description |\n'
    markdown += '| ---- | ----------- |\n'

    // テーブル形式でルールを表示
    for (const rule of sortedRules) {
      markdown += ruleToMarkdownTableRow(rule)
    }
  } else {
    // 通常フォーマット: リスト形式（テスト用）
    for (const rule of sortedRules) {
      markdown += ruleToMarkdownListItem(rule)
    }
  }

  markdown += '\n'
  return markdown
}

/**
 * ルールをマークダウンテーブル行に変換（拡張フォーマット用）
 */
function ruleToMarkdownTableRow(rule: RulensRule): string {
  // 重要度とオプションの表示を構築
  const metadataText = buildRuleMetadataText(rule)

  // ルール名とURL
  let ruleName = rule.name
  if (rule.url) {
    ruleName = `[\`${rule.name}\`](${rule.url})`
  } else {
    ruleName = `\`${rule.name}\``
  }

  // 説明文と重要度
  let description = rule.description
  if (metadataText) {
    description += ` ${metadataText}`
  }

  return `| ${ruleName} | ${description} |\n`
}

/**
 * ルールをマークダウンリストアイテムに変換（テスト互換性用）
 */
function ruleToMarkdownListItem(rule: RulensRule): string {
  // 重要度とオプションの表示を構築
  const metadataText = buildRuleMetadataText(rule)

  // URLがある場合はリンク付きで表示
  let line = ''
  if (rule.url) {
    line = `- [\`${rule.name}\`](${rule.url}): ${rule.description}`
  } else {
    line = `- \`${rule.name}\`: ${rule.description}`
  }

  // メタデータがあれば追加
  if (metadataText) {
    line += ` ${metadataText}`
  }

  return `${line}\n`
}

/**
 * ルールのメタデータ（重要度とオプション）を文字列として生成
 */
function buildRuleMetadataText(rule: RulensRule): string {
  const metadataParts: string[] = []

  // 重要度があれば追加
  if (rule.severity) {
    metadataParts.push(rule.severity)
  }

  // オプションがあれば追加
  if (rule.options) {
    metadataParts.push('with options')
  }

  // メタデータがある場合は括弧で囲んで表示
  if (metadataParts.length > 0) {
    return `(${metadataParts.join(', ')})`
  }

  return ''
}
