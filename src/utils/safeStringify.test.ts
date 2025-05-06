import { describe, expect, it } from 'vitest'
import { safeStringify } from './safeStringify.ts'

describe('safeStringify', () => {
  it('should stringify simple objects', () => {
    const simpleObj = { name: 'test', value: 123 }
    const result = safeStringify(simpleObj)

    expect(result.isOk()).toBe(true)
    result.map((data) => {
      expect(data).toBe('{\n  "name": "test",\n  "value": 123\n}')
    })
  })

  it('should stringify arrays', () => {
    const array = [1, 2, 3, 'test']
    const result = safeStringify(array)

    expect(result.isOk()).toBe(true)
    result.map((data) => {
      expect(data).toBe('[\n  1,\n  2,\n  3,\n  "test"\n]')
    })
  })

  it('should handle null values', () => {
    const nullValue: null = null
    const result = safeStringify(nullValue)

    expect(result.isOk()).toBe(true)
    result.map((data) => {
      expect(data).toBe('null')
    })
  })

  it('should handle undefined values', () => {
    const obj = { a: undefined }
    const result = safeStringify(obj)

    expect(result.isOk()).toBe(true)
    // JSON.stringify treats undefined as omitted properties
    result.map((data) => {
      expect(data).toBe('{}')
    })
  })

  it('should handle circular references', () => {
    interface CircularObject extends Record<string, unknown> {
      self?: CircularObject
    }
    const circularObj: CircularObject = { name: 'circular' }
    circularObj.self = circularObj

    const result = safeStringify(circularObj)

    expect(result.isOk()).toBe(true)
    result.map((data) => {
      expect(data).toContain('"name": "circular"')
      expect(data).toContain('"self": "[Circular]"')
    })
  })

  it('should handle nested circular references', () => {
    interface CircularRefObject extends Record<string, unknown> {
      ref?: CircularRefObject
    }
    const obj1: CircularRefObject = { name: 'obj1' }
    const obj2: CircularRefObject = { name: 'obj2', ref: obj1 }
    obj1.ref = obj2

    const result = safeStringify(obj1)

    expect(result.isOk()).toBe(true)
    result.map((data) => {
      expect(data).toContain('"name": "obj1"')
      expect(data).toContain('"name": "obj2"')
      expect(data).toContain('"ref": "[Circular]"')
    })
  })

  it('should handle non-object values', () => {
    expect(safeStringify(123).isOk()).toBe(true)
    safeStringify(123).map((data) => expect(data).toBe('123'))

    expect(safeStringify('string').isOk()).toBe(true)
    safeStringify('string').map((data) => expect(data).toBe('"string"'))

    expect(safeStringify(true).isOk()).toBe(true)
    safeStringify(true).map((data) => expect(data).toBe('true'))

    expect(safeStringify(false).isOk()).toBe(true)
    safeStringify(false).map((data) => expect(data).toBe('false'))
  })

  it('should handle invalid JSON', () => {
    // Create an object with a circular structure that JSON.stringify can't handle
    interface CyclicObj extends Record<string, unknown> {
      a?: CyclicObj
    }
    const cyclicObj: CyclicObj = {}
    // create a circular reference
    cyclicObj.a = cyclicObj // This would throw without our circular reference handling

    // Our implementation should handle this with the custom replacer
    const result = safeStringify(cyclicObj)
    expect(result.isOk()).toBe(true)
  })
})
