/**
 * Biomeルールの説明に関する型定義
 */
export interface BiomeRuleDescription {
  [ruleId: string]: {
    description: string
    url?: string
  }
}
