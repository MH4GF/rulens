import { describe, expect, it } from 'vitest'
import { resolveBinary } from './bin-resolver.ts'

describe('bin-resolver', () => {
  it('returns a Result object', async () => {
    const binary = 'eslint'
    const result = await resolveBinary(binary)

    expect(result.isOk()).toBe(true)
  })
})
