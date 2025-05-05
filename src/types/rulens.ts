/**
 * 個別のルール情報を表す型
 */
export interface RulensRule {
  id: string // 完全なルールID (例: "suspicious/noCatchAssign")
  name: string // ルール名のみ (例: "noCatchAssign")
  description: string // 説明文
  url?: string // ドキュメントURL (任意)
  severity?: string // ルールの重要度 (任意、"error"/"warn"/"off"など)
  options?: unknown // ルール固有のオプション設定 (任意)
}

/**
 * カテゴリー内のルール集合を表す型
 */
export interface RulensCategory {
  name: string // カテゴリー名 (例: "suspicious")
  description?: string // カテゴリーの説明 (任意)
  rules: RulensRule[] // このカテゴリーに属するルール
}

/**
 * Lintツール全体の設定を表す型
 */
export interface RulensLinter {
  name: string // Linterの名前 (例: "Biome", "ESLint")
  categories: RulensCategory[] // カテゴリーのリスト
}
