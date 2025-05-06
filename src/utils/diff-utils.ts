import fs from 'node:fs/promises'
import path from 'node:path'
import { ResultAsync, err, ok } from 'neverthrow'
import { Logger } from './logger.ts'

/**
 * Options for comparing content
 */
interface CompareOptions {
  verbose?: boolean | undefined // Whether to output detailed comparison information
}

/**
 * Result of comparison
 */
interface CompareResult {
  identical: boolean // Whether the contents are identical
  message: string // Message describing the comparison result
  actualContent?: string | undefined // Actual generated content (only when verbose is true)
  expectedContent?: string | undefined // Expected content (only when verbose is true)
}

/**
 * Pure function to normalize content for comparison
 * - Normalizes line endings to LF
 * - Trims whitespace from beginning and end
 */
export function normalizeContent(content: string): string {
  return content
    .replace(/\r\n/g, '\n') // Normalize Windows CRLF to Unix LF
    .trim() // Remove leading/trailing whitespace
}

/**
 * Pure function to compare two strings after normalization
 */
export function compareContent(
  existingContent: string,
  generatedContent: string,
  options: CompareOptions = {},
): CompareResult {
  // Normalize line endings to ensure consistent comparison
  const normalizedExisting = normalizeContent(existingContent)
  const normalizedGenerated = normalizeContent(generatedContent)

  // Compare the contents
  const identical = normalizedExisting === normalizedGenerated

  // Return result
  if (identical) {
    return {
      identical: true,
      message: 'Contents are identical',
    }
  }
  return {
    identical: false,
    message: 'Contents differ',
    actualContent: options.verbose ? normalizedGenerated : undefined,
    expectedContent: options.verbose ? normalizedExisting : undefined,
  }
}

/**
 * 指定されたファイルが存在するかチェックする関数
 */
function checkFileExists(filePath: string): ResultAsync<boolean, Error> {
  return ResultAsync.fromPromise(
    fs.access(filePath).then(() => true),
    () => new Error("File doesn't exist"),
  ).orElse(() => ok(false)) // Convert errors to success with false value
}

/**
 * ファイルを読み込む関数
 */
function readFile(filePath: string): ResultAsync<string, Error> {
  return ResultAsync.fromPromise(fs.readFile(filePath, 'utf-8'), (error) =>
    error instanceof Error ? error : new Error(String(error)),
  )
}

/**
 * File-based wrapper around compareContent
 * Handles file reading and content comparison
 * Returns ResultAsync with CompareResult
 */
export function compareWithFile(
  filePath: string,
  generatedContent: string,
  options: CompareOptions = {},
): ResultAsync<CompareResult, Error> {
  const logger = new Logger({ verbose: options.verbose })

  // ファイルの存在をチェック
  return checkFileExists(filePath)
    .andThen((exists) => {
      if (!exists) {
        logger.warn(`Target file ${filePath} doesn't exist, can't compare`)
        return ok<CompareResult, Error>({
          identical: false,
          message: `Target file ${filePath} doesn't exist`,
          actualContent: options.verbose ? generatedContent : undefined,
        })
      }

      // ファイルの内容を読み込む
      return readFile(filePath).map((existingContent) => {
        // 純粋な関数で比較
        const result = compareContent(existingContent, generatedContent, options)

        // 結果をログに出力
        if (result.identical) {
          logger.info(`Files are identical: ${filePath}`)
        } else {
          logger.warn(`Files differ: ${filePath}`)
        }

        return result
      })
    })
    .orElse((error) => {
      logger.error(`Error comparing files: ${error.message}`)
      return ok<CompareResult, Error>({
        identical: false,
        message: `Error comparing files: ${error.message}`,
      })
    })
}

/**
 * Ensure directory exists before writing file
 */
function ensureDirectoryExists(filePath: string): ResultAsync<void, Error> {
  const directory = path.dirname(filePath)

  return ResultAsync.fromPromise(
    fs.mkdir(directory, { recursive: true }).then(() => undefined),
    (error): Error => (error instanceof Error ? error : new Error(String(error))),
  ).orElse((error) => {
    // Ignore error if directory already exists
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      return ok(undefined)
    }
    return err(error)
  })
}

/**
 * ファイルに内容を書き込む関数
 */
function writeFile(filePath: string, content: string): ResultAsync<void, Error> {
  return ResultAsync.fromPromise(fs.writeFile(filePath, content, 'utf-8'), (error) =>
    error instanceof Error ? error : new Error(String(error)),
  )
}

/**
 * Update file with new content if they're different
 * Returns ResultAsync<boolean, Error>
 * boolean: true if file was updated, false if no update was needed
 */
export function updateFile(filePath: string, newContent: string): ResultAsync<boolean, Error> {
  const logger = new Logger()

  // ファイルの存在と内容をチェック
  return checkFileExists(filePath)
    .andThen((exists) => {
      if (!exists) {
        // ファイルが存在しない場合、ディレクトリの作成後に新規作成
        logger.info(`File ${filePath} doesn't exist, will create it`)
        return ensureDirectoryExists(filePath)
          .andThen(() => writeFile(filePath, newContent))
          .map(() => {
            logger.info(`Created file: ${filePath}`)
            return true // ファイルを更新した
          })
      }

      // ファイルが存在する場合、内容を読み込んで比較
      return readFile(filePath).andThen((existingContent) => {
        const comparison = compareContent(existingContent, newContent)

        // 内容が同一の場合、更新不要
        if (comparison.identical) {
          logger.info(`File content unchanged, no update needed: ${filePath}`)
          return ok(false) // ファイルを更新していない
        }

        // 内容が異なる場合、ファイルを更新
        return writeFile(filePath, newContent).map(() => {
          logger.info(`Updated file: ${filePath}`)
          return true // ファイルを更新した
        })
      })
    })
    .orElse((error) => {
      logger.error(`Error updating file: ${error.message}`)
      return err(error) // エラーをそのまま伝播
    })
}
