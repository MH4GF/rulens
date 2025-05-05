/**
 * Custom JSON stringify function to handle circular references
 */
export function safeStringify(obj: unknown): string {
  const seen = new Set()
  return JSON.stringify(
    obj,
    (_key, value: unknown) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]'
        }
        seen.add(value)
      }
      return value
    },
    2,
  )
}
