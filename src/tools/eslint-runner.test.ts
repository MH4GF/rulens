import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { extractRulesAndMeta, findESLintConfig, runESLintConfig } from './eslint-runner.ts'

// Define regular expression at top level
const CONFIG_FILE_NOT_FOUND_REGEX = /ESLint config file not found/
describe('eslint-runner', () => {
  describe('runESLintConfig', () => {
    // Test specifying config file path
    it('should load ESLint config using bundle-require and return the expected result structure', async () => {
      // Specify eslint config file path
      const configPath = 'eslint.config.js' // Default config file name

      // Actually load the configuration
      const resultAsync = await runESLintConfig({ configPath })

      // Verify the result is OK
      expect(resultAsync.isOk()).toBe(true)

      // Extract the result value
      const result = resultAsync._unsafeUnwrap()

      // Verify the expected result structure (using specific checks instead of snapshots)
      expect(result).toHaveProperty('raw')
      expect(result).toHaveProperty('rules')
      expect(result).toHaveProperty('rulesMeta')

      // Confirm that rules are included in this project's ESLint configuration
      expect(Object.keys(result.rules).length).toBeGreaterThan(0)

      // Note: rawConfig structure varies by project, so changed to a simple check
      // Verify that raw is a string instead of JSON data
      expect(typeof result.raw).toBe('string')
      expect(result.raw).toContain('"rules"')

      // Only check the structure of rules
      const rules = result.rules
      expect(Object.keys(rules).length).toBeGreaterThan(0)

      // Verify that at least some standard ESLint rules exist
      // Select ones that are likely to be included in the project
      const commonRules = ['no-empty', 'no-unused-vars', 'no-console', 'no-debugger']
      const hasAtLeastOneCommonRule = commonRules.some((rule) => rule in rules)
      expect(hasAtLeastOneCommonRule).toBe(true)

      // Verify that metadata is correctly extracted
      expect(Object.keys(result.rulesMeta).length).toBeGreaterThan(0)
    })

    // Error test when specifying a non-existent configuration file
    it('should return an error result if the specified config file does not exist', async () => {
      const nonExistentConfigPath = 'non-existent-config.js'

      const result = await runESLintConfig({ configPath: nonExistentConfigPath })

      expect(result.isErr()).toBe(true)

      if (result.isErr()) {
        expect(result.error.message).toMatch(CONFIG_FILE_NOT_FOUND_REGEX)
      }
    })
  })

  describe('findESLintConfig', () => {
    it('should return an error result when config not found', () => {
      // Use a non-existent file path to force the error
      const nonExistentPath = path.resolve('./non-existent-dir', 'non-existent-config.js')
      const result = findESLintConfig(nonExistentPath)

      expect(result.isErr()).toBe(true)

      if (result.isErr()) {
        expect(result.error.message).toMatch(CONFIG_FILE_NOT_FOUND_REGEX)
      }
    })
  })

  describe('extractRulesAndMeta', () => {
    // Test rule and metadata extraction
    it('should extract rules and metadata from ESLint config object', () => {
      // ESLint configuration object
      const mockConfig = [
        {
          // Rule settings
          rules: {
            'no-console': 'error',
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
          },
        },
        {
          // Plugin settings
          plugins: {
            '@typescript-eslint': {
              rules: {
                'no-explicit-any': {
                  meta: {
                    type: 'problem',
                    docs: {
                      description: 'Disallow the `any` type',
                      url: 'https://typescript-eslint.io/rules/no-explicit-any',
                    },
                  },
                },
              },
            },
          },
        },
      ]

      // Extract rules and metadata
      const result = extractRulesAndMeta(mockConfig)

      // Verify the result is OK
      expect(result.isOk()).toBe(true)

      // Safely unwrap the result
      const { rules, rulesMeta } = result._unsafeUnwrap()

      // Verify that rules are correctly extracted
      expect(rules).toHaveProperty('no-console', 'error')
      expect(rules).toHaveProperty('no-unused-vars')

      // Verify that metadata is correctly extracted
      expect(rulesMeta).toHaveProperty('@typescript-eslint/no-explicit-any')
      expect(rulesMeta['@typescript-eslint/no-explicit-any']).toEqual({
        description: 'Disallow the `any` type',
        url: 'https://typescript-eslint.io/rules/no-explicit-any',
        recommended: false,
        type: 'problem',
      })
    })

    // Verify that an empty config object can be processed
    it('should handle empty config objects', () => {
      const emptyConfig = {}
      const result = extractRulesAndMeta(emptyConfig)

      expect(result.isOk()).toBe(true)

      const { rules, rulesMeta } = result._unsafeUnwrap()

      expect(rules).toEqual({})
      expect(rulesMeta).toEqual({})
    })

    // Verify that complex nested configurations can be processed
    it('should handle nested config objects with configs property', () => {
      const nestedConfig = [
        {
          plugins: {
            'plugin-name': {
              configs: {
                recommended: {
                  plugins: {
                    'nested-plugin': {
                      rules: {
                        'nested-rule': {
                          meta: {
                            type: 'suggestion',
                            docs: {
                              description: 'A nested rule description',
                              url: 'https://example.com/rules/nested-rule',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ]

      const result = extractRulesAndMeta(nestedConfig)
      expect(result.isOk()).toBe(true)

      const { rulesMeta } = result._unsafeUnwrap()

      expect(rulesMeta).toHaveProperty('nested-plugin/nested-rule')
      expect(rulesMeta['nested-plugin/nested-rule']?.description).toBe('A nested rule description')
    })

    // Test handling of array format rules
    it('should extract rules from array format', () => {
      const arrayConfig = {
        rules: {
          'array-rule': ['error', { option1: true }],
        },
      }

      const result = extractRulesAndMeta(arrayConfig)
      expect(result.isOk()).toBe(true)

      const { rules } = result._unsafeUnwrap()
      expect(rules).toHaveProperty('array-rule')
      expect(rules['array-rule']).toEqual(['error', { option1: true }])
    })

    // Test plugins metadata extraction
    it('should extract plugins metadata', () => {
      const pluginsConfig = {
        plugins: {
          'test-plugin': {
            meta: {
              description: 'A test plugin description',
            },
            rules: {
              'test-rule': {
                meta: {
                  type: 'problem',
                  docs: {
                    description: 'A test rule',
                  },
                },
              },
            },
          },
        },
      }

      const result = extractRulesAndMeta(pluginsConfig)
      expect(result.isOk()).toBe(true)

      const { rulesMeta, pluginsMetadata } = result._unsafeUnwrap()

      // Check plugins metadata
      expect(pluginsMetadata).toHaveProperty('test-plugin')
      expect(pluginsMetadata?.['test-plugin']?.description).toBe('A test plugin description')

      // Check rule metadata
      expect(rulesMeta).toHaveProperty('test-plugin/test-rule')
      expect(rulesMeta?.['test-plugin/test-rule']?.description).toBe('A test rule')
    })
  })
})
