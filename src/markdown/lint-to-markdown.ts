import type { RulensCategory, RulensLinter, RulensRule } from '../types/rulens.ts'

/**
 * 共通中間表現からマークダウンを生成する
 */
export function lintRulesToMarkdown(linter: RulensLinter): string {
  const { name, categories } = linter

  let markdown = `## ${name} Rules\n\n`

  if (categories.length === 0) {
    markdown += 'No rules enabled.\n'
    return markdown
  }

  // カテゴリをアルファベット順にソート（すでにソート済みでも念のため）
  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name))

  for (const category of sortedCategories) {
    markdown += categoryToMarkdown(category)

    // 最後のカテゴリ以外で改行を追加
    if (category !== sortedCategories[sortedCategories.length - 1]) {
      markdown += '\n'
    }
  }

  return markdown
}

/**
 * カテゴリをマークダウンに変換
 */
function categoryToMarkdown(category: RulensCategory): string {
  let markdown = `### ${category.name}\n\n`

  if (category.rules.length === 0) {
    markdown += 'No rules in this category.\n'
    return markdown
  }

  // カテゴリ説明があれば追加
  if (category.description) {
    markdown += `${category.description}\n\n`
  }

  // ルールをアルファベット順にソート
  const sortedRules = [...category.rules].sort((a, b) => a.name.localeCompare(b.name))

  for (const rule of sortedRules) {
    markdown += ruleToMarkdown(rule)
  }

  return markdown
}

/**
 * ルールをマークダウンに変換
 */
function ruleToMarkdown(rule: RulensRule): string {
  // 重要度とオプションの表示を構築
  const metadataText = buildRuleMetadataText(rule)

  // URLがある場合はリンク付きで表示
  if (rule.url) {
    return `- [\`${rule.name}\`](${rule.url}): ${rule.description}${metadataText}\n`
  }

  // URLがない場合はリンクなしで表示
  return `- \`${rule.name}\`: ${rule.description}${metadataText}\n`
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
    return ` (${metadataParts.join(', ')})`
  }

  return ''
}
