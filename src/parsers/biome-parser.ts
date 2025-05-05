import biomeRuleDescriptionsData from '../data/biome-rules.json' with { type: 'json' }
import type { BiomeRageResult } from '../tools/biome-runner.ts'
import type { BiomeRuleDescription } from '../types/biome-rules.js'
import type { RulensCategory, RulensLinter, RulensRule } from '../types/rulens.ts'

// Import JSON file
const biomeRuleDescriptions: BiomeRuleDescription =
  biomeRuleDescriptionsData as BiomeRuleDescription

/**
 * Convert Biome execution results to common intermediate representation
 */
export function parseBiomeRules(biomeResult: BiomeRageResult): RulensLinter {
  const { rules } = biomeResult

  // Categorize rules by category
  const categorizedRules = categorizeRules(rules)

  // Sort categories alphabetically
  const categories = Object.keys(categorizedRules)
    .sort()
    .map((categoryName): RulensCategory => {
      const categoryRules = categorizedRules[categoryName] || []
      const rules = categoryRules.map((ruleInfo): RulensRule => {
        // Get rule description and URL from JSON
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
 * Extract category and name from rule ID
 */
function parseRuleId(ruleId: string): { category: string; name: string; id: string } {
  const parts = ruleId.split('/')

  // If rule ID format is invalid
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return {
      category: 'other',
      name: ruleId.replace(/\//g, '_'),
      id: ruleId,
    }
  }

  const [category, name] = parts

  // Normalize a11y category to accessibility
  const normalizedCategory = category === 'a11y' ? 'accessibility' : category

  return {
    category: normalizedCategory,
    name,
    id: ruleId,
  }
}

/**
 * Categorize rule list by category
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
 * Get description and URL based on rule ID
 */
function getRuleDescription(ruleId: string): RuleDescription {
  // Search in JSON with format like a11y/useAltText
  const info = biomeRuleDescriptions[ruleId]
  if (info) {
    return {
      description: info.description,
      url: info.url,
    }
  }

  // Rule ID being processed
  const { category, name } = parseRuleId(ruleId)

  // Need to convert accessibility → a11y
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

  // Convert Suspicious/noThenProperty → suspicious/noThenProperty (case adjustment)
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

  // In Biome, it's common to search in JSON using the category/ruleName format
  // Strictly consider case sensitivity
  for (const key of Object.keys(biomeRuleDescriptions)) {
    // Check for exact match or case-insensitive match
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

  // If corresponding rule information is not found
  return {}
}
