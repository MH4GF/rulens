import { describe, expect, it } from 'vitest'
import type { RulensLinter } from '../types/rulens.ts'
import { lintRulesToMarkdown } from './lint-to-markdown.ts'

describe('lintRulesToMarkdown', () => {
  it('should generate markdown from common intermediate representation', () => {
    // Arrange
    const rulensLinter: RulensLinter = {
      name: 'TestLinter',
      categories: [
        {
          name: 'style',
          rules: [
            {
              id: 'style/useConst',
              name: 'useConst',
              description: 'Require const declarations for variables that are only assigned once.',
              url: 'https://example.com/rules/use-const',
            },
            {
              id: 'style/noVar',
              name: 'noVar',
              description: 'Disallow the use of var.',
              url: 'https://example.com/rules/no-var',
            },
          ],
        },
        {
          name: 'security',
          rules: [
            {
              id: 'security/noEval',
              name: 'noEval',
              description: 'Disallow the use of eval().',
              url: 'https://example.com/rules/no-eval',
            },
          ],
        },
      ],
    }

    // Act
    const result = lintRulesToMarkdown(rulensLinter)

    // Assert
    expect(result).toContain('## TestLinter Rules')
    expect(result).toContain('### security')
    expect(result).toContain('### style')
    expect(result).toContain(
      '[`useConst`](https://example.com/rules/use-const): Require const declarations',
    )
    expect(result).toContain('[`noVar`](https://example.com/rules/no-var): Disallow the use of var')
    expect(result).toContain(
      '[`noEval`](https://example.com/rules/no-eval): Disallow the use of eval()',
    )
  })

  it('should handle rules without URLs', () => {
    // Arrange
    const rulensLinter: RulensLinter = {
      name: 'TestLinter',
      categories: [
        {
          name: 'style',
          rules: [
            {
              id: 'style/useConst',
              name: 'useConst',
              description: 'Require const declarations for variables that are only assigned once.',
              // URL無し
            },
          ],
        },
      ],
    }

    // Act
    const result = lintRulesToMarkdown(rulensLinter)

    // Assert
    expect(result).toContain('`useConst`: Require const declarations')
    expect(result).not.toContain('[`useConst`]')
  })

  it('should handle rules with severity and options', () => {
    // Arrange
    const rulensLinter: RulensLinter = {
      name: 'TestLinter',
      categories: [
        {
          name: 'style',
          rules: [
            {
              id: 'style/useConst',
              name: 'useConst',
              description: 'Require const declarations for variables that are only assigned once.',
              severity: 'error',
              options: { allowLet: true },
            },
          ],
        },
      ],
    }

    // Act
    const result = lintRulesToMarkdown(rulensLinter)

    // Assert
    expect(result).toContain('`useConst`: Require const declarations')
    expect(result).toContain('(error, with options)')
  })

  it('should handle empty linter', () => {
    // Arrange
    const emptyLinter: RulensLinter = {
      name: 'EmptyLinter',
      categories: [],
    }

    // Act
    const result = lintRulesToMarkdown(emptyLinter)

    // Assert
    expect(result).toContain('## EmptyLinter Rules')
    expect(result).toContain('No rules enabled.')
  })

  it('should handle empty categories', () => {
    // Arrange
    const linterWithEmptyCategory: RulensLinter = {
      name: 'TestLinter',
      categories: [
        {
          name: 'emptyCategory',
          rules: [], // 空のルールリスト
        },
      ],
    }

    // Act
    const result = lintRulesToMarkdown(linterWithEmptyCategory)

    // Assert
    expect(result).toContain('### emptyCategory')
    expect(result).toContain('No rules in this category.')
  })
})
