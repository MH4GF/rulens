import type { ESLintConfigResult } from '../tools/eslint-runner.ts'
import type { RulensCategory, RulensLinter, RulensRule } from '../types/rulens.ts'

/**
 * ESLintの実行結果を共通中間表現に変換する
 */
export function parseESLintRules(eslintResult: ESLintConfigResult): RulensLinter {
  const { rules } = eslintResult

  if (!rules || Object.keys(rules).length === 0) {
    return {
      name: 'ESLint',
      categories: [],
    }
  }

  // ルールごとにカテゴリ分類
  const categorizedRules = categorizeESLintRules(rules)

  // カテゴリをアルファベット順にソート
  const categories = Object.keys(categorizedRules)
    .sort()
    .map((categoryName): RulensCategory => {
      const rulesInCategory = categorizedRules[categoryName]
      // Check if rulesInCategory is defined
      if (!rulesInCategory) {
        return {
          name: categoryName,
          rules: [],
        }
      }

      const categoryRules = Object.entries(rulesInCategory).map(
        ([ruleName, ruleConfig]): RulensRule => {
          const { severity, options } = parseRuleConfig(ruleConfig)

          // ESLintではruleNameは 'no-console' のような形式で、
          // プラグインの場合は '@typescript-eslint/no-explicit-any' のような形式
          const fullRuleId =
            categoryName === 'ESLint Core' ? ruleName : `${categoryName}/${ruleName}`

          return {
            id: fullRuleId,
            name: ruleName,
            description: `ESLint rule: ${ruleName}`, // 将来的にはESLintルール説明のJSONデータから取得
            severity: severity || 'unknown', // Ensure severity is never undefined
            ...(options ? { options } : {}),
          }
        },
      )

      return {
        name: categoryName,
        rules: categoryRules,
      }
    })

  return {
    name: 'ESLint',
    categories,
  }
}

/**
 * ESLintルールをカテゴリごとに分類
 */
function categorizeESLintRules(
  rules: Record<string, unknown>,
): Record<string, Record<string, unknown>> {
  const categorized: Record<string, Record<string, unknown>> = {}

  for (const [ruleId, ruleConfig] of Object.entries(rules)) {
    // プラグインルールかコアルールかを判定
    let category: string
    let ruleName: string

    if (ruleId.includes('/')) {
      // プラグインルール (例: '@typescript-eslint/no-explicit-any')
      const parts = ruleId.split('/')
      if (parts.length >= 2) {
        category = parts[0] || 'ESLint Core'
        ruleName = parts[1] || ruleId
      } else {
        // フォールバック
        category = 'ESLint Core'
        ruleName = ruleId
      }
    } else {
      // コアルール (例: 'no-console')
      category = 'ESLint Core'
      ruleName = ruleId
    }

    // カテゴリを初期化してルールを追加
    const categoryRules = categorized[category] ?? {}
    categoryRules[ruleName] = ruleConfig
    categorized[category] = categoryRules
  }

  return categorized
}

/**
 * ESLintルール設定から重要度とオプションを解析
 */
function parseRuleConfig(config: unknown): { severity: string; options?: unknown } {
  // 文字列形式 (例: 'error', 'warn', 'off')
  if (typeof config === 'string') {
    return { severity: config }
  }

  // 数値形式 (例: 0, 1, 2)
  if (typeof config === 'number') {
    return { severity: convertNumericSeverity(config) }
  }

  // 配列形式 (例: ['error', { option1: true }])
  if (Array.isArray(config) && config.length > 0) {
    // 最初の要素を重要度として扱う
    const severityValue: unknown = config[0]
    const optionsValues = config.slice(1)

    // 数値または文字列の重要度をstring型に変換
    const severity =
      typeof severityValue === 'number'
        ? convertNumericSeverity(severityValue)
        : typeof severityValue === 'string'
          ? severityValue
          : 'unknown'

    return {
      severity,
      options: optionsValues.length === 1 ? optionsValues[0] : optionsValues,
    }
  }

  // 不明な形式の場合はデフォルト値を返す
  return { severity: 'unknown' }
}

/**
 * 数値形式の重要度を文字列に変換
 */
function convertNumericSeverity(value: number): string {
  switch (value) {
    case 0:
      return 'off'
    case 1:
      return 'warn'
    case 2:
      return 'error'
    default:
      return 'unknown'
  }
}
