import { describe, expect, it } from 'vitest'
import type { BiomeRageResult } from '../tools/biome-runner.ts'
import {
  biomeCategoryToMarkdown,
  biomeRulesToCategorizedMap,
  biomeRulesToMarkdown,
} from './biome-to-markdown.ts'

describe('biome-to-markdown', () => {
  describe('biomeRulesToCategorizedMap', () => {
    it('should categorize biome rules into categories', () => {
      // Arrange
      const rules = [
        'style/useTemplate',
        'suspicious/noCatchAssign',
        'a11y/noAutofocus',
        'style/noImplicitBoolean',
        'suspicious/noExplicitAny',
        'a11y/useAltText',
      ]

      // Act
      const categorized = biomeRulesToCategorizedMap(rules)

      // Assert
      expect(categorized).toEqual({
        style: ['useTemplate', 'noImplicitBoolean'],
        suspicious: ['noCatchAssign', 'noExplicitAny'],
        a11y: ['noAutofocus', 'useAltText'],
      })
    })

    it('should handle empty rules array', () => {
      const categorized = biomeRulesToCategorizedMap([])
      expect(categorized).toEqual({})
    })
  })

  describe('biomeCategoryToMarkdown', () => {
    it('should convert category and rules to markdown section', () => {
      // Arrange
      const category = 'style'
      const rules = ['useTemplate', 'noImplicitBoolean', 'useBlockStatements']

      // Act
      const markdown = biomeCategoryToMarkdown(category, rules)

      // Assert
      expect(markdown).toMatchInlineSnapshot(`
        "### style

        - \`useTemplate\`
        - \`noImplicitBoolean\`
        - \`useBlockStatements\`
        "
      `)
    })

    it('should handle empty rules array', () => {
      const markdown = biomeCategoryToMarkdown('emptyCategory', [])
      expect(markdown).toMatchInlineSnapshot(`
        "### emptyCategory

        "
      `)
    })
  })

  describe('biomeRulesToMarkdown', () => {
    it('should convert biome rules to full markdown document', () => {
      // Arrange
      const biomeResult: BiomeRageResult = {
        raw: 'some raw output',
        rules: [
          'style/useTemplate',
          'suspicious/noCatchAssign',
          'a11y/noAutofocus',
          'style/noImplicitBoolean',
          'suspicious/noExplicitAny',
          'a11y/useAltText',
        ],
      }

      // Act
      const markdown = biomeRulesToMarkdown(biomeResult)

      // Assert
      expect(markdown).toMatchInlineSnapshot(`
        "## Biome Rules

        ### a11y

        - \`noAutofocus\`
        - \`useAltText\`

        ### style

        - \`useTemplate\`
        - \`noImplicitBoolean\`

        ### suspicious

        - \`noCatchAssign\`
        - \`noExplicitAny\`
        "
      `)
    })

    it('should handle empty rules array', () => {
      const markdown = biomeRulesToMarkdown({ raw: '', rules: [] })
      expect(markdown).toMatchInlineSnapshot(`
        "## Biome Rules

        No rules enabled.
        "
      `)
    })
  })
})
