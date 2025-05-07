import { describe, expect, it } from 'vitest'
import type { BiomeRageResult } from '../tools/biome-runner.ts'
import { parseBiomeRules } from './biome-parser.ts'

describe('parseBiomeRules', () => {
  // Define common mock data
  const createMockBiomeResult = (): BiomeRageResult => ({
    raw: 'Biome rage output',
    rules: [
      'suspicious/noCatchAssign',
      'suspicious/noDebugger',
      'style/useConst',
      'a11y/useAltText',
    ],
  })

  it('should parse Biome rules with correct basic structure', () => {
    // Arrange
    const mockBiomeResult = createMockBiomeResult()

    // Act
    const result = parseBiomeRules(mockBiomeResult)

    // Assert
    expect(result).toBeDefined()
    expect(result.name).toBe('Biome')
    expect(result.categories).toHaveLength(3) // 3 categories: suspicious, style, a11y
  })

  it('should sort categories correctly', () => {
    // Arrange
    const mockBiomeResult = createMockBiomeResult()

    // Act
    const result = parseBiomeRules(mockBiomeResult)
    const categories = result.categories

    // Assert
    if (categories.length >= 3) {
      const category0 = categories[0]
      const category1 = categories[1]
      const category2 = categories[2]

      expect(category0).toBeDefined()
      expect(category1).toBeDefined()
      expect(category2).toBeDefined()

      if (category0 && category1 && category2) {
        expect(category0.name).toBe('accessibility')
        expect(category1.name).toBe('style')
        expect(category2.name).toBe('suspicious')
      }
    }
  })

  it('should correctly convert suspicious rules', () => {
    // Arrange
    const mockBiomeResult = createMockBiomeResult()

    // Act
    const result = parseBiomeRules(mockBiomeResult)

    // Assert
    const suspiciousRules = result.categories.find((c) => c.name === 'suspicious')?.rules
    expect(suspiciousRules).toBeDefined()

    if (suspiciousRules) {
      expect(suspiciousRules.length).toBe(2)

      const firstRule = suspiciousRules[0]
      expect(firstRule).toBeDefined()

      if (firstRule) {
        expect(firstRule.id).toBe('suspicious/noCatchAssign')
        expect(firstRule.name).toBe('noCatchAssign')
        expect(firstRule.description).toBeDefined()
      }
    }
  })

  it('should correctly convert a11y rules to accessibility category', () => {
    // Arrange
    const mockBiomeResult = createMockBiomeResult()

    // Act
    const result = parseBiomeRules(mockBiomeResult)

    // Assert
    const a11yRules = result.categories.find((c) => c.name === 'accessibility')?.rules
    expect(a11yRules).toBeDefined()

    if (a11yRules) {
      expect(a11yRules.length).toBe(1)

      const firstRule = a11yRules[0]
      expect(firstRule).toBeDefined()

      if (firstRule) {
        expect(firstRule.id).toBe('a11y/useAltText')
        expect(firstRule.name).toBe('useAltText')
      }
    }
  })

  it('should handle empty rules array', () => {
    // Arrange
    const mockBiomeResult: BiomeRageResult = {
      raw: 'Empty rage output',
      rules: [],
    }

    // Act
    const result = parseBiomeRules(mockBiomeResult)

    // Assert
    expect(result).toBeDefined()
    expect(result.name).toBe('Biome')
    expect(result.categories).toHaveLength(0)
  })

  it('should include rule descriptions and URLs from biome-rules.json', () => {
    // Arrange
    const mockBiomeResult: BiomeRageResult = {
      raw: 'Biome rage output',
      rules: ['suspicious/noCatchAssign'],
    }

    // Act
    const result = parseBiomeRules(mockBiomeResult)

    // Assert
    const categories = result.categories
    expect(categories.length).toBeGreaterThan(0)
    const firstCategory = categories[0]
    expect(firstCategory).toBeDefined()
    if (firstCategory) {
      expect(firstCategory.rules.length).toBeGreaterThan(0)
      const firstRule = firstCategory.rules[0]
      expect(firstRule).toBeDefined()
      if (firstRule) {
        expect(firstRule.description).toBe('Disallow reassigning exceptions in catch clauses\\.')
        expect(firstRule.url).toBe('https://biomejs.dev/linter/rules/no-catch-assign')
      }
    }
  })

  it('should provide a default description for rules not found in biome-rules.json', () => {
    // Arrange
    const mockBiomeResult: BiomeRageResult = {
      raw: 'Biome rage output',
      rules: ['unknown/nonExistentRule'],
    }

    // Act
    const result = parseBiomeRules(mockBiomeResult)

    // Assert
    const categories = result.categories
    expect(categories.length).toBeGreaterThan(0)
    const firstCategory = categories[0]
    expect(firstCategory).toBeDefined()
    if (firstCategory) {
      expect(firstCategory.rules.length).toBeGreaterThan(0)
      const firstRule = firstCategory.rules[0]
      expect(firstRule).toBeDefined()
      if (firstRule) {
        expect(firstRule.description).toBe('No description available')
        expect(firstRule.url).toBeUndefined()
      }
    }
  })

  it('should normalize a11y category to accessibility', () => {
    // Arrange
    const mockBiomeResult: BiomeRageResult = {
      raw: 'Biome rage output',
      rules: ['a11y/useAltText'],
    }

    // Act
    const result = parseBiomeRules(mockBiomeResult)

    // Assert
    const categories = result.categories
    expect(categories.length).toBeGreaterThan(0)

    const firstCategory = categories[0]
    expect(firstCategory).toBeDefined()

    if (firstCategory) {
      expect(firstCategory.name).toBe('accessibility')

      const firstRule = firstCategory.rules[0]
      if (firstRule) {
        expect(firstRule.id).toBe('a11y/useAltText')
      }
    }
  })

  it('should handle rules with non-standard category formats', () => {
    // Arrange
    const mockBiomeResult: BiomeRageResult = {
      raw: 'Biome rage output',
      rules: [
        'suspicious/noCatchAssign',
        'malformed-rule', // No category
        '/onlyRuleName', // Empty category
        'category/rule/extra', // Extra slash
      ],
    }

    // Act
    const result = parseBiomeRules(mockBiomeResult)

    // Assert
    expect(result.categories.length).toBeGreaterThanOrEqual(2) // 'suspicious' and 'other'

    // Malformed rules are categorized into the 'other' category
    const otherCategory = result.categories.find((c) => c.name === 'other')
    expect(otherCategory).toBeDefined()
    if (otherCategory) {
      expect(otherCategory.rules.length).toBe(3)
    }
  })
})
