import biomeRuleDescriptionsData from '../data/biome-rules.json' with { type: 'json' }
import type { BiomeRageResult } from '../tools/biome-runner.ts'
import type { BiomeRuleDescription } from '../types/biome-rules.js'
import type { RulensCategory, RulensLinter, RulensRule } from '../types/rulens.ts'

// JSONファイルをインポート
const biomeRuleDescriptions: BiomeRuleDescription =
  biomeRuleDescriptionsData as BiomeRuleDescription

/**
 * Biomeの実行結果を共通中間表現に変換する
 */
export function parseBiomeRules(biomeResult: BiomeRageResult): RulensLinter {
  const { rules } = biomeResult

  // カテゴリごとにルールを分類
  const categorizedRules = categorizeRules(rules)

  // カテゴリをアルファベット順にソート
  const categories = Object.keys(categorizedRules)
    .sort()
    .map((categoryName): RulensCategory => {
      const categoryRules = categorizedRules[categoryName] || []
      const rules = categoryRules.map((ruleInfo): RulensRule => {
        // JSONからルールの説明とURLを取得
        const ruleDescription = getRuleDescription(ruleInfo.id)

        return {
          id: ruleInfo.id,
          name: ruleInfo.name,
          description: ruleDescription.description || 'No description available',
          ...(ruleDescription.url ? { url: ruleDescription.url } : {}),
        }
      })

      return {
        name: categoryName,
        rules,
      }
    })

  return {
    name: 'Biome',
    categories,
  }
}

/**
 * ルールIDからカテゴリと名前を抽出する
 */
function parseRuleId(ruleId: string): { category: string; name: string; id: string } {
  const parts = ruleId.split('/')

  // ルールIDのフォーマットが不正の場合
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return {
      category: 'other',
      name: ruleId.replace(/\//g, '_'),
      id: ruleId,
    }
  }

  const [category, name] = parts

  // a11y カテゴリは accessibility に正規化
  const normalizedCategory = category === 'a11y' ? 'accessibility' : category

  return {
    category: normalizedCategory,
    name,
    id: ruleId,
  }
}

/**
 * ルールリストをカテゴリ別に分類する
 */
function categorizeRules(rules: string[]): Record<string, Array<{ id: string; name: string }>> {
  const result: Record<string, Array<{ id: string; name: string }>> = {}

  for (const ruleId of rules) {
    const { category, name, id } = parseRuleId(ruleId)

    if (!result[category]) {
      result[category] = []
    }

    result[category].push({ id, name })
  }

  return result
}

interface RuleDescription {
  description?: string
  url?: string | undefined
}

/**
 * ルールIDに基づいて説明とURLを取得
 */
function getRuleDescription(ruleId: string): RuleDescription {
  // a11y/useAltText のような形式でJSON内を検索
  const info = biomeRuleDescriptions[ruleId]
  if (info) {
    return {
      description: info.description,
      url: info.url,
    }
  }

  // 処理対象のルールID
  const { category, name } = parseRuleId(ruleId)

  // accessibility → a11y の変換が必要
  if (category === 'accessibility') {
    const a11yRuleId = `a11y/${name}`
    const a11yInfo = biomeRuleDescriptions[a11yRuleId]
    if (a11yInfo) {
      return {
        description: a11yInfo.description,
        url: a11yInfo.url,
      }
    }
  }

  // Suspicious/noThenProperty → suspicious/noThenProperty の変換（大文字小文字の調整）
  const lowerCaseCategory = category.toLowerCase()
  if (lowerCaseCategory !== category) {
    const lowerCaseRuleId = `${lowerCaseCategory}/${name}`
    const lowerCaseInfo = biomeRuleDescriptions[lowerCaseRuleId]
    if (lowerCaseInfo) {
      return {
        description: lowerCaseInfo.description,
        url: lowerCaseInfo.url,
      }
    }
  }

  // Biome では category/ruleName の形式でJSON内を検索することが一般的
  // 大文字小文字を厳密に考慮
  for (const key of Object.keys(biomeRuleDescriptions)) {
    // 完全一致か、大文字小文字を無視した一致を確認
    if (key.toLowerCase() === ruleId.toLowerCase()) {
      const info = biomeRuleDescriptions[key]
      if (info) {
        return {
          description: info.description,
          url: info.url,
        }
      }
    }
  }

  // 対応するルール情報が見つからない場合
  return {}
}
