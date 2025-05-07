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
        accessibility: ['noAutofocus', 'useAltText'],
      })
    })

    it('should handle empty rules array', () => {
      const categorized = biomeRulesToCategorizedMap([])
      expect(categorized).toEqual({})
    })
  })

  describe('biomeCategoryToMarkdown', () => {
    it('should convert category and rules to markdown section with descriptions if available', () => {
      // Arrange
      const category = 'style'
      const rules = ['useTemplate', 'noImplicitBoolean', 'useBlockStatements']

      // Act
      const markdown = biomeCategoryToMarkdown(category, rules)

      // Assert
      expect(markdown).toMatchInlineSnapshot(`
        "### style

        - [\`noImplicitBoolean\`](https://biomejs.dev/linter/rules/no-implicit-boolean): Disallow implicit true values on JSX boolean attributes
        - [\`useBlockStatements\`](https://biomejs.dev/linter/rules/use-block-statements): Requires following curly brace conventions\\.
        - [\`useTemplate\`](https://biomejs.dev/linter/rules/use-template): Prefer template literals over string concatenation\\.
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
    it('should convert biome rules to full markdown document with descriptions if available', () => {
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

        ### accessibility

        - [\`noAutofocus\`](https://biomejs.dev/linter/rules/no-autofocus): Enforce that autoFocus prop is not used on elements\\.
        - [\`useAltText\`](https://biomejs.dev/linter/rules/use-alt-text): Enforce that all elements that require alternative text have meaningful information to relay back to the end user\\.

        ### style

        - [\`noImplicitBoolean\`](https://biomejs.dev/linter/rules/no-implicit-boolean): Disallow implicit true values on JSX boolean attributes
        - [\`useTemplate\`](https://biomejs.dev/linter/rules/use-template): Prefer template literals over string concatenation\\.

        ### suspicious

        - [\`noCatchAssign\`](https://biomejs.dev/linter/rules/no-catch-assign): Disallow reassigning exceptions in catch clauses\\.
        - [\`noExplicitAny\`](https://biomejs.dev/linter/rules/no-explicit-any): Disallow the any type usage\\.
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
