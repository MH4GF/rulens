import { describe, expect, it } from 'vitest'
import { safeStringify } from './safeStringify.ts'

describe('safeStringify', () => {
  it('should stringify simple objects', () => {
    const simpleObj = { name: 'test', value: 123 }
    const result = safeStringify(simpleObj)
    expect(result).toBe('{\n  "name": "test",\n  "value": 123\n}')
  })

  it('should stringify arrays', () => {
    const array = [1, 2, 3, 'test']
    const result = safeStringify(array)
    expect(result).toBe('[\n  1,\n  2,\n  3,\n  "test"\n]')
  })

  it('should handle null values', () => {
    const nullValue = null
    const result = safeStringify(nullValue)
    expect(result).toBe('null')
  })

  it('should handle undefined values', () => {
    const obj = { a: undefined }
    const result = safeStringify(obj)
    // JSON.stringify treats undefined as omitted properties
    expect(result).toBe('{}')
  })

  it('should handle circular references', () => {
    const circularObj: Record<string, any> = { name: 'circular' }
    circularObj.self = circularObj

    const result = safeStringify(circularObj)
    expect(result).toContain('"name": "circular"')
    expect(result).toContain('"self": "[Circular]"')
  })

  it('should handle nested circular references', () => {
    const obj1: Record<string, any> = { name: 'obj1' }
    const obj2 = { name: 'obj2', ref: obj1 }
    obj1.ref = obj2

    const result = safeStringify(obj1)
    expect(result).toContain('"name": "obj1"')
    expect(result).toContain('"name": "obj2"')
    expect(result).toContain('"ref": "[Circular]"')
  })

  it('should handle non-object values', () => {
    expect(safeStringify(123)).toBe('123')
    expect(safeStringify('string')).toBe('"string"')
    expect(safeStringify(true)).toBe('true')
    expect(safeStringify(false)).toBe('false')
  })
})
