import { describe, expect, it } from 'vitest'
import type { ESLintConfigResult } from '../tools/eslint-runner.ts'
import {
  eslintCategoryToMarkdown,
  eslintRulesToCategorizedMap,
  eslintRulesToMarkdown,
} from './eslint-to-markdown.ts'

describe('eslint-to-markdown', () => {
  describe('eslintRulesToCategorizedMap', () => {
    it('should categorize eslint rules into categories', () => {
      // Arrange
      const rules = {
        'no-console': 'error',
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unused-vars': 'warn',
        'react/prop-types': 'off',
        'react/no-array-index-key': 'error',
        'import/no-unresolved': 'error',
      }

      // Act
      const categorized = eslintRulesToCategorizedMap(rules)

      // Assert
      expect(categorized).toEqual({
        'ESLint Core': ['no-console', 'no-unused-vars'],
        '@typescript-eslint': ['no-explicit-any', 'no-unused-vars'],
        react: ['prop-types', 'no-array-index-key'],
        import: ['no-unresolved'],
      })
    })

    it('should handle empty rules object', () => {
      const categorized = eslintRulesToCategorizedMap({})
      expect(categorized).toEqual({})
    })
  })

  describe('eslintCategoryToMarkdown', () => {
    it('should convert category and rules to markdown section', () => {
      // Arrange
      const category = 'ESLint Core'
      const rulesData = {
        'no-console': 'error',
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        'no-empty': 'off',
      }

      // Act
      const markdown = eslintCategoryToMarkdown(category, rulesData)

      // Assert
      expect(markdown).toEqual(`### ESLint Core

- \`no-console\`: error
- \`no-empty\`: off
- \`no-unused-vars\`: warn (with options)
`)
    })

    it('should handle various rule value formats', () => {
      // Arrange
      const category = 'Mixed Formats'
      const rulesData = {
        'string-rule': 'error',
        'array-level-rule': ['warn'],
        'array-options-rule': ['error', { key: 'value' }],
        'number-format-rule': 2,
        'off-rule': 'off',
      }

      // Act
      const markdown = eslintCategoryToMarkdown(category, rulesData)

      // Assert
      expect(markdown).toEqual(`### Mixed Formats

- \`array-level-rule\`: warn
- \`array-options-rule\`: error (with options)
- \`number-format-rule\`: error
- \`off-rule\`: off
- \`string-rule\`: error
`)
    })

    it('should handle empty rules object', () => {
      const markdown = eslintCategoryToMarkdown('Empty Category', {})
      expect(markdown).toEqual(`### Empty Category

`)
    })
  })

  describe('eslintRulesToMarkdown', () => {
    it('should convert eslint rules to full markdown document', () => {
      // Arrange
      const eslintResult: ESLintConfigResult = {
        raw: '{"rules":{"no-console":"error","no-unused-vars":["warn",{"argsIgnorePattern":"^_"}],"@typescript-eslint/no-explicit-any":"error","react/prop-types":"off"}}',
        rules: {
          'no-console': 'error',
          'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
          '@typescript-eslint/no-explicit-any': 'error',
          'react/prop-types': 'off',
        },
        rulesMeta: {},
      }

      // Act
      const markdown = eslintRulesToMarkdown(eslintResult)

      // Assert
      // Don't use snapshots for more flexibility in test ordering
      expect(markdown).toContain('## ESLint Rules')
      expect(markdown).toContain('### @typescript-eslint')
      expect(markdown).toContain('- `no-explicit-any`: error')
      expect(markdown).toContain('### ESLint Core')
      expect(markdown).toContain('- `no-console`: error')
      expect(markdown).toContain('- `no-unused-vars`: warn (with options)')
      expect(markdown).toContain('### react')
      expect(markdown).toContain('- `prop-types`: off')
    })

    it('should handle empty rules object', () => {
      const markdown = eslintRulesToMarkdown({ raw: '', rules: {}, rulesMeta: {} })
      expect(markdown).toEqual(`## ESLint Rules

No rules enabled.
`)
    })
  })
})
