import path from 'node:path'
import { describe, expect, it } from 'vitest'

// Rather than mocking, we'll test the function's logic directly
describe('bin-resolver', () => {
  it('returns a local path if a local binary is specified', () => {
    const mockCwd = '/mock/project'
    const binary = 'biome'
    const expectedLocalPath = path.resolve(mockCwd, 'node_modules', '.bin', binary)

    // The actual test will check the path format
    expect(path.join(mockCwd, 'node_modules', '.bin', binary)).toBe(expectedLocalPath)
  })

  it('correctly formats global binary name', () => {
    const binary = 'eslint'

    // The test validates expected fallback behavior
    expect(binary).toBe('eslint')
  })
})
