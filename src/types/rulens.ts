/**
 * Type representing individual rule information
 */
export interface RulensRule {
  id: string // Complete rule ID (e.g., "suspicious/noCatchAssign")
  name: string // Rule name only (e.g., "noCatchAssign")
  description: string // Description text
  url?: string // Documentation URL (optional)
  severity?: string // Rule severity (optional, "error"/"warn"/"off" etc.)
  options?: unknown // Rule-specific option settings (optional)
}

/**
 * Type representing a set of rules within a category
 */
export interface RulensCategory {
  name: string // Category name (e.g., "suspicious")
  description?: string // Category description (optional)
  rules: RulensRule[] // Rules belonging to this category
}

/**
 * Type representing the configuration of the entire lint tool
 */
export interface RulensLinter {
  name: string // Linter name (e.g., "Biome", "ESLint")
  categories: RulensCategory[] // List of categories
}
