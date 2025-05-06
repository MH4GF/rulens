import fs from 'node:fs/promises'
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
 * File-based wrapper around compareContent
 * Handles file reading and content comparison
 */
export async function compareWithFile(
  filePath: string,
  generatedContent: string,
  options: CompareOptions = {},
): Promise<CompareResult> {
  const logger = new Logger({ verbose: options.verbose })

  try {
    // Check if the file exists
    try {
      await fs.access(filePath)
    } catch {
      logger.warn(`Target file ${filePath} doesn't exist, can't compare`)
      return {
        identical: false,
        message: `Target file ${filePath} doesn't exist`,
        actualContent: options.verbose ? generatedContent : undefined,
      }
    }

    // Read the existing file
    const existingContent = await fs.readFile(filePath, 'utf-8')

    // Compare using pure function
    const result = compareContent(existingContent, generatedContent, options)

    // Log the result
    if (result.identical) {
      logger.info(`Files are identical: ${filePath}`)
    } else {
      logger.warn(`Files differ: ${filePath}`)
    }

    return result
  } catch (error) {
    logger.error(`Error comparing files: ${error instanceof Error ? error.message : String(error)}`)
    return {
      identical: false,
      message: `Error comparing files: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Update file with new content if they're different
 * Returns true if file was updated, false if no update was needed
 */
export async function updateFile(filePath: string, newContent: string): Promise<boolean> {
  const logger = new Logger()

  try {
    // Check if file exists and read its content if it does
    let existingContent = ''
    let fileExists = true

    try {
      existingContent = await fs.readFile(filePath, 'utf-8')
    } catch {
      // File doesn't exist, will be created
      fileExists = false
      logger.info(`File ${filePath} doesn't exist, will create it`)
    }

    // Compare if file exists
    if (fileExists) {
      const comparison = compareContent(existingContent, newContent)

      // If identical, no update needed
      if (comparison.identical) {
        logger.info(`File content unchanged, no update needed: ${filePath}`)
        return false
      }
    }

    // Content is different or file doesn't exist, create/update the file
    await fs.writeFile(filePath, newContent, 'utf-8')
    logger.info(`${fileExists ? 'Updated' : 'Created'} file: ${filePath}`)
    return true
  } catch (error) {
    logger.error(`Error updating file: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}
