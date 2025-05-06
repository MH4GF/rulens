import { safeParse } from 'valibot'
import { describe, expect, it } from 'vitest'
import {
  type GenerateOptions,
  type LintOptions,
  generateOptionsSchema,
  lintOptionsSchema,
} from './validators.ts'

describe('validators', () => {
  describe('generateOptionsSchema', () => {
    it('should validate valid generate options', () => {
      const validOptions = {
        biomeArgs: '--some-arg',
        eslintConfig: 'eslint.config.js',
        output: 'docs/rules.md',
        verbose: true,
      }

      const result = safeParse(generateOptionsSchema, validOptions)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.output).toEqual(validOptions)
      }
    })

    it('should validate minimum required generate options', () => {
      const minOptions = {
        output: 'docs/rules.md',
      }

      const result = safeParse(generateOptionsSchema, minOptions)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.output).toEqual(minOptions)
      }
    })

    it('should reject generate options without required output', () => {
      const invalidOptions = {
        biomeArgs: '--some-arg',
        eslintConfig: 'eslint.config.js',
        verbose: true,
      }

      const result = safeParse(generateOptionsSchema, invalidOptions)
      expect(result.success).toBe(false)
    })

    it('should reject generate options with wrong types', () => {
      const wrongTypeOptions = {
        biomeArgs: 123, // should be string
        eslintConfig: true, // should be string
        output: 'docs/rules.md',
        verbose: 'yes', // should be boolean
      }

      const result = safeParse(generateOptionsSchema, wrongTypeOptions)
      expect(result.success).toBe(false)
    })
  })

  describe('lintOptionsSchema', () => {
    it('should validate valid lint options', () => {
      const validOptions = {
        biomeArgs: '--some-arg',
        eslintConfig: 'eslint.config.js',
        output: 'docs/rules.md',
        update: true,
        verbose: true,
      }

      const result = safeParse(lintOptionsSchema, validOptions)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.output).toEqual(validOptions)
      }
    })

    it('should validate minimum required lint options', () => {
      const minOptions = {
        output: 'docs/rules.md',
      }

      const result = safeParse(lintOptionsSchema, minOptions)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.output).toEqual(minOptions)
      }
    })

    it('should reject lint options without required output', () => {
      const invalidOptions = {
        biomeArgs: '--some-arg',
        eslintConfig: 'eslint.config.js',
        update: true,
        verbose: true,
      }

      const result = safeParse(lintOptionsSchema, invalidOptions)
      expect(result.success).toBe(false)
    })

    it('should reject lint options with wrong types', () => {
      const wrongTypeOptions = {
        biomeArgs: 123, // should be string
        eslintConfig: true, // should be string
        output: 'docs/rules.md',
        update: 'yes', // should be boolean
        verbose: 123, // should be boolean
      }

      const result = safeParse(lintOptionsSchema, wrongTypeOptions)
      expect(result.success).toBe(false)
    })
  })

  // Type tests (these don't contribute to coverage but ensure our types work correctly)
  it('should have correct type definitions', () => {
    // These are just type checks, no runtime assertions
    const generateOptions: GenerateOptions = {
      biomeArgs: '--arg',
      eslintConfig: 'config.js',
      output: 'output.md',
      verbose: true,
    }

    const lintOptions: LintOptions = {
      biomeArgs: '--arg',
      eslintConfig: 'config.js',
      output: 'output.md',
      update: true,
      verbose: true,
    }

    // If we can assign these values without TypeScript errors, types are working
    expect(generateOptions).toBeDefined()
    expect(lintOptions).toBeDefined()
  })
})
