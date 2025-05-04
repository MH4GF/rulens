import pc from 'picocolors'

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LoggerOptions {
  verbose?: boolean
}

export class Logger {
  private level: LogLevel

  constructor(options: LoggerOptions = {}) {
    this.level = options.verbose ? LogLevel.DEBUG : LogLevel.INFO
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
}
