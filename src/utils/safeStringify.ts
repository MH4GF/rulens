import { type Result, fromThrowable } from 'neverthrow'

/**
 * Custom JSON stringify function to handle circular references
 * Returns a Result containing either the stringified object or an error
 */
export function safeStringify(obj: unknown): Result<string, Error> {
  const safeStringifyFn = fromThrowable(
    (input: unknown): string => {
      const seen = new Set()
      return JSON.stringify(
        input,
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
    },
    (error) => (error instanceof Error ? error : new Error('Failed to stringify object')),
  )

  return safeStringifyFn(obj)
}
