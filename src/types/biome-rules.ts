/**
 * Type definitions for Biome rule descriptions
 */
export interface BiomeRuleDescription {
  [ruleId: string]: {
    description: string
    url?: string
  }
}
