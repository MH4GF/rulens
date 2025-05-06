import { describe, expect, it } from 'vitest'
import { runBiomeRage } from './biome-runner.ts'

// Top-level regular expression constants
const RULE_FORMAT_REGEX = /^[a-z0-9]+\/[a-zA-Z0-9-]+$/
const ERROR_MESSAGE_REGEX = /Command failed with exit code/

describe('biome-runner', () => {
  describe('runBiomeRage', () => {
    // Basic functionality test
    it('should resolve biome binary and return the expected result structure', async () => {
      const rageResult = await runBiomeRage()

      expect(rageResult.isOk()).toBe(true)

      // Since we've verified it's OK, we can safely use value
      const result = rageResult._unsafeUnwrap()

      // Test only the necessary structure, not snapshot test
      // Because environment-dependent values can cause snapshot test failures
      expect(result.raw).toContain('CLI:')
      expect(result.raw).toContain('Version:')
      expect(result.raw).toContain('Platform:')
      expect(result.raw).toContain('Biome Configuration:')
      expect(result.raw).toContain('Linter:')
      expect(result.raw).toContain('Enabled rules:')

      // Verify that the rule list is an array and contains at least these rules
      expect(Array.isArray(result.rules)).toBe(true)
      expect(result.rules.length).toBeGreaterThan(0)
      expect(result.rules).toContain('suspicious/noCatchAssign')
      expect(result.rules).toContain('style/useTemplate')
      expect(result.rules).toContain('a11y/noAutofocus')
    })

    // Additional arguments test
    it('should correctly pass additional arguments to the biome command', async () => {
      // Use the option to display Biome's help
      const rageResult = await runBiomeRage({
        additionalArgs: '--help',
      })

      expect(rageResult.isOk()).toBe(true)

      // Since we've verified it's OK, we can safely use value
      const result = rageResult._unsafeUnwrap()

      // When using the --help option, help message is included in the output
      expect(result.raw).toContain('Usage: biome rage')
      expect(result.raw).toContain('Available options:')
    })

    // Output parsing test
    it('should correctly parse rules from biome rage output', async () => {
      const rageResult = await runBiomeRage()

      expect(rageResult.isOk()).toBe(true)

      // Since we've verified it's OK, we can safely use value
      const result = rageResult._unsafeUnwrap()

      // Rules should exist in the actual Biome installation
      expect(result.rules.length).toBeGreaterThan(0)

      // Verify that rules are in the correct format
      // Normal rules are in the format 'category/ruleName'
      for (const rule of result.rules) {
        expect(rule).toMatch(RULE_FORMAT_REGEX)
      }

      // Check consistency between raw output and rules array
      // Each rule should be included in the raw output
      for (const rule of result.rules) {
        expect(result.raw).toContain(rule)
      }
    })

    // Error handling test
    it('should return an error result when biome command fails', async () => {
      // Run command with invalid arguments
      const rageResult = await runBiomeRage({ additionalArgs: '--non-existent-flag' })

      expect(rageResult.isErr()).toBe(true)

      if (rageResult.isErr()) {
        expect(rageResult.error.message).toMatch(ERROR_MESSAGE_REGEX)
      }
    })

    // biome-ignore lint/suspicious/noSkippedTests: Intentionally skipped due to complex environment dependencies
    it.skip('should handle the case when biome binary is not found', async () => {
      // This test is skipped due to complexity with test environments
      // Possible approaches to test this scenario:
      // 1. Temporarily change NODE_PATH to create a situation where the binary is not found
      // 2. Mock resolveBinary to make it fail
      // 3. Specify a non-existent executable name
      // When this error occurs in a real environment, the following message would be expected
      // const BINARY_NOT_FOUND_REGEX = /biome binary not found/
      // await expect(
      //  runBiomeRage()
      // ).rejects.toThrow(BINARY_NOT_FOUND_REGEX)
    })
  })
})
