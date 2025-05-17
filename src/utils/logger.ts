import pc from 'picocolors'
import { safeStringify } from './safeStringify.ts'

const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const

type LogLevel = (typeof LogLevel)[keyof typeof LogLevel]

interface LoggerOptions {
  verbose?: boolean | undefined
}

export class Logger {
  private level: LogLevel
  private verboseMode: boolean

  constructor(options: LoggerOptions = {}) {
    this.verboseMode = options.verbose ?? false
    this.level = this.verboseMode ? LogLevel.DEBUG : LogLevel.INFO
  }

  debug(message: string): void {
    if (this.level <= LogLevel.DEBUG) {
      // biome-ignore lint/suspicious/noConsole: Logger implementation
      // biome-ignore lint/suspicious/noConsoleLog: Logger implementation
      console.log(pc.gray(`[DEBUG] ${message}`))
    }
  }

  info(message: string): void {
    if (this.level <= LogLevel.INFO) {
      // biome-ignore lint/suspicious/noConsole: Logger implementation
      // biome-ignore lint/suspicious/noConsoleLog: Logger implementation
      console.log(pc.blue(`[INFO] ${message}`))
    }
  }

  warn(message: string): void {
    if (this.level <= LogLevel.WARN) {
      // biome-ignore lint/suspicious/noConsole: Logger implementation
      // biome-ignore lint/suspicious/noConsoleLog: Logger implementation
      console.log(pc.yellow(`[WARN] ${message}`))
    }
  }

  error(message: string): void {
    if (this.level <= LogLevel.ERROR) {
      // biome-ignore lint/suspicious/noConsole: Logger implementation
      console.error(pc.red(`[ERROR] ${message}`))
    }
  }

  success(message: string): void {
    if (this.level <= LogLevel.INFO) {
      // biome-ignore lint/suspicious/noConsole: Logger implementation
      // biome-ignore lint/suspicious/noConsoleLog: Logger implementation
      console.log(pc.green(`[SUCCESS] ${message}`))
    }
  }

  /**
   * Dumps an object to the console when verbose mode is enabled
   * @param label Label to describe the object being dumped
   * @param obj Object to dump
   */
  dump(label: string, obj: unknown): void {
    if (this.verboseMode) {
      // biome-ignore lint/suspicious/noConsole: Logger implementation
      // biome-ignore lint/suspicious/noConsoleLog: Logger implementation
      console.log(pc.cyan(`\n[VERBOSE] ${label}`))

      if (typeof obj === 'object' && obj !== null) {
        const stringifyResult = safeStringify(obj)

        stringifyResult.match(
          // Success case
          (value) => {
            // biome-ignore lint/suspicious/noConsole: Logger implementation
            // biome-ignore lint/suspicious/noConsoleLog: Logger implementation
            console.log(value)
          },
          // Error case
          () => {
            // biome-ignore lint/suspicious/noConsole: Logger implementation
            // biome-ignore lint/suspicious/noConsoleLog: Logger implementation
            console.log(pc.yellow('Unable to stringify object (circular references)'))
          },
        )
      } else {
        // biome-ignore lint/suspicious/noConsole: Logger implementation
        // biome-ignore lint/suspicious/noConsoleLog: Logger implementation
        console.log(obj)
      }

      // biome-ignore lint/suspicious/noConsole: Logger implementation
      // biome-ignore lint/suspicious/noConsoleLog: Logger implementation
      console.log(pc.cyan('--------------------------'))
    }
  }

  /**
   * Checks if verbose mode is enabled
   */
  isVerboseMode(): boolean {
    return this.verboseMode
  }
}
