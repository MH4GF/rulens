import { describe, expect, it } from 'vitest'
import type { ESLintConfigResult } from '../tools/eslint-runner.ts'
import { parseESLintRules } from './eslint-parser.ts'

describe('parseESLintRules', () => {
  // Define common mock data
  const createMockESLintResult = (): ESLintConfigResult => ({
    raw: 'ESLint config output',
    rules: {
      'no-console': 'error',
      'no-debugger': 2,
      '@typescript-eslint/no-explicit-any': ['error', { ignoreRestArgs: true }],
      'react/prop-types': 'off',
      'unused-imports/no-unused-imports': 'warn',
    },
    rulesMeta: {},
  })

  it('should parse ESLint rules with correct basic structure', () => {
    // Arrange
    const mockESLintResult = createMockESLintResult()

    // Act
    const result = parseESLintRules(mockESLintResult)

    // Assert
    expect(result).toBeDefined()
    expect(result.name).toBe('ESLint')
    expect(result.categories).toHaveLength(4) // ESLint Core, @typescript-eslint, react, unused-imports
  })

  it('should contain all expected categories', () => {
    // Arrange
    const mockESLintResult = createMockESLintResult()

    // Act
    const result = parseESLintRules(mockESLintResult)

    // Assert
    const categories = result.categories.map((c) => c.name)
    expect(categories).toContain('ESLint Core')
    expect(categories).toContain('@typescript-eslint')
    expect(categories).toContain('react')
    expect(categories).toContain('unused-imports')
  })

  it('should correctly convert ESLint Core rules', () => {
    // Arrange
    const mockESLintResult = createMockESLintResult()

    // Act
    const result = parseESLintRules(mockESLintResult)

    // Assert
    const coreRules = result.categories.find((c) => c.name === 'ESLint Core')?.rules
    expect(coreRules).toBeDefined()

    if (coreRules) {
      expect(coreRules.length).toBe(2)

      const firstRule = coreRules[0]
      expect(firstRule).toBeDefined()

      if (firstRule) {
        expect(firstRule.id).toBe('no-console')
        expect(firstRule.name).toBe('no-console')
        expect(firstRule.severity).toBe('error')
      }
    }
  })

  it('should correctly convert TypeScript plugin rules', () => {
    // Arrange
    const mockESLintResult = createMockESLintResult()

    // Act
    const result = parseESLintRules(mockESLintResult)

    // Assert
    const tsRules = result.categories.find((c) => c.name === '@typescript-eslint')?.rules
    expect(tsRules).toBeDefined()

    if (tsRules) {
      expect(tsRules.length).toBe(1)

      const firstRule = tsRules[0]
      expect(firstRule).toBeDefined()

      if (firstRule) {
        expect(firstRule.id).toBe('@typescript-eslint/no-explicit-any')
        expect(firstRule.name).toBe('no-explicit-any')
        expect(firstRule.severity).toBe('error')
        expect(firstRule.options).toEqual({ ignoreRestArgs: true })
      }
    }
  })

  it('should correctly convert severity values', () => {
    // Arrange
    const mockESLintResult = createMockESLintResult()

    // Act
    const result = parseESLintRules(mockESLintResult)

    // Assert - React rules (off)
    const reactRules = result.categories.find((c) => c.name === 'react')?.rules
    if (reactRules && reactRules.length > 0) {
      const firstRule = reactRules[0]
      if (firstRule) {
        expect(firstRule.severity).toBe('off')
      }
    }

    // Assert - Unused imports (warn)
    const unusedImportsRules = result.categories.find((c) => c.name === 'unused-imports')?.rules
    if (unusedImportsRules && unusedImportsRules.length > 0) {
      const firstRule = unusedImportsRules[0]
      if (firstRule) {
        expect(firstRule.severity).toBe('warn')
      }
    }
  })

  it('should handle empty rules object', () => {
    // Arrange
    const mockESLintResult: ESLintConfigResult = {
      raw: 'Empty config output',
      rules: {},
      rulesMeta: {},
    }

    // Act
    const result = parseESLintRules(mockESLintResult)

    // Assert
    expect(result).toBeDefined()
    expect(result.name).toBe('ESLint')
    expect(result.categories).toHaveLength(0)
  })

  it('should provide default descriptions for rules', () => {
    // Arrange
    const mockESLintResult: ESLintConfigResult = {
      raw: 'ESLint config output',
      rules: {
        'no-console': 'error',
      },
      rulesMeta: {},
    }

    // Act
    const result = parseESLintRules(mockESLintResult)

    // Assert
    expect(result.categories.length).toBeGreaterThan(0)

    const firstCategory = result.categories[0]
    expect(firstCategory).toBeDefined()

    if (firstCategory) {
      expect(firstCategory.rules.length).toBeGreaterThan(0)

      const rule = firstCategory.rules[0]
      expect(rule).toBeDefined()

      if (rule) {
        expect(rule.description).toBeDefined()
        expect(rule.description).toBe('ESLint rule: no-console')
      }
    }
  })

  it('should handle rules with numeric severity values', () => {
    // Arrange
    const mockESLintResult: ESLintConfigResult = {
      raw: 'ESLint config output',
      rules: {
        'rule-a': 0, // 'off'
        'rule-b': 1, // 'warn'
        'rule-c': 2, // 'error'
      },
      rulesMeta: {},
    }

    // Act
    const result = parseESLintRules(mockESLintResult)

    // Assert
    expect(result.categories.length).toBeGreaterThan(0)

    const firstCategory = result.categories[0]
    expect(firstCategory).toBeDefined()

    if (firstCategory) {
      // We only expect 2 rules because 'off' rules are filtered out in parseESLintRules
      expect(firstCategory.rules.length).toBe(2)

      const rules = firstCategory.rules

      if (rules.length >= 2) {
        const rule0 = rules[0]
        const rule1 = rules[1]

        expect(rule0).toBeDefined()
        expect(rule1).toBeDefined()

        // Verify we have both warn and error rules (rule with severity 'off' is filtered out)
        const severities = [rule0?.severity, rule1?.severity].filter(Boolean) as string[]
        expect(severities).toContain('warn')
        expect(severities).toContain('error')
      }
    }
  })

  it('should handle rules with complex configuration', () => {
    // Arrange
    const mockESLintResult: ESLintConfigResult = {
      raw: 'ESLint config output',
      rules: {
        'complex-rule': ['error', { setting1: true }, { setting2: 'value' }],
      },
      rulesMeta: {},
    }

    // Act
    const result = parseESLintRules(mockESLintResult)

    // Assert
    expect(result.categories.length).toBeGreaterThan(0)

    const firstCategory = result.categories[0]
    expect(firstCategory).toBeDefined()

    if (firstCategory) {
      expect(firstCategory.rules.length).toBeGreaterThan(0)

      const rule = firstCategory.rules[0]
      expect(rule).toBeDefined()

      if (rule) {
        expect(rule.severity).toBe('error')
        expect(rule.options).toEqual([{ setting1: true }, { setting2: 'value' }])
      }
    }
  })
})
