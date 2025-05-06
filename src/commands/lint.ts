import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import type { ResultAsync } from 'neverthrow'
import { generateMarkdown } from '../markdown/generator.ts'
import type { BiomeRageResult } from '../tools/biome-runner.ts'
import { runBiomeRage } from '../tools/biome-runner.ts'
import type { ESLintConfigResult } from '../tools/eslint-runner.ts'
import { runESLintConfig } from '../tools/eslint-runner.ts'
import { compareWithFile, updateFile } from '../utils/diff-utils.ts'
import { Logger } from '../utils/logger.ts'
import { type LintOptions, lintOptionsSchema } from '../utils/validators.ts'

/**
 * Fetch Biome configuration
 */
function fetchBiomeConfig(
  options: Pick<LintOptions, 'biomeArgs' | 'verbose'>,
  logger: Logger,
): ResultAsync<BiomeRageResult, Error> {
  logger.info('Fetching Biome configuration...')

  return runBiomeRage({
    additionalArgs: options.biomeArgs ?? undefined,
    verbose: options.verbose ?? undefined,
  }).map((result) => {
    logger.info(`Found ${result.rules.length} Biome rules`)
    return result
  })
}

/**
 * Fetch ESLint configuration
 */
function fetchESLintConfig(
  options: Pick<LintOptions, 'eslintConfig' | 'verbose'>,
  logger: Logger,
): ResultAsync<ESLintConfigResult, Error> {
  logger.info('Fetching ESLint configuration using bundle-require...')

  return runESLintConfig({
    configPath: options.eslintConfig,
    verbose: options.verbose ?? undefined,
  }).map((result) => {
    const eslintRulesCount = Object.keys(result.rules).length
    const eslintMetaCount = Object.keys(result.rulesMeta).length
    logger.info(
      `Found ${eslintRulesCount} ESLint rules and ${eslintMetaCount} rule metadata entries`,
    )
    return result
  })
}

/**
 * Handle comparison result and optionally update file
 */
async function handleComparisonResult(
  comparison: { identical: boolean },
  options: Pick<LintOptions, 'output' | 'update'>,
  tempFile: string,
  logger: Logger,
): Promise<boolean> {
  if (comparison.identical) {
    logger.info('✅ Lint rules documentation is up-to-date!')
    // Clean up temp file
    await fs.unlink(tempFile)
    return true
  }

  logger.warn('❌ Lint rules documentation is out of date!')

  if (options.update) {
    logger.info('Updating documentation file...')
    await updateFile(options.output, await fs.readFile(tempFile, 'utf-8'))
    logger.info(`✅ Documentation updated at ${options.output}`)
  } else {
    logger.info('Run with --update to update the documentation automatically')
    logger.info('or run `rulens generate` to update it manually')
  }

  // Clean up temp file
  await fs.unlink(tempFile)
  return false
}

/**
 * Checks if the generated markdown file is up-to-date
 * If not, returns false and optionally updates the file
 */
export async function executeLint(options: LintOptions): Promise<boolean> {
  // Reference to schema to avoid unused export warning
  // biome-ignore lint/complexity/noVoid: Just referencing the schema
  void lintOptionsSchema

  const logger = new Logger({ verbose: options.verbose })
  logger.info('Executing lint command...')

  // Check if the output file exists
  if (!existsSync(options.output)) {
    logger.error(`Output file ${options.output} does not exist. Run 'rulens generate' first.`)
    return false
  }

  const biomeResult = await fetchBiomeConfig(options, logger)
    .mapErr((error) => {
      logger.warn(`Biome not found or failed to run: ${error.message}`)
      logger.info('Continuing without Biome rules...')
    })
    .unwrapOr(null)

  const eslintResult = await fetchESLintConfig(options, logger)
    .mapErr((error) => {
      logger.warn(`ESLint not found or failed to run: ${error.message}`)
      logger.info('Continuing without ESLint rules...')
    })
    .unwrapOr(null)

  // Check if we have any results to generate
  if (!(biomeResult || eslintResult)) {
    logger.warn(
      'No linter configurations found. Ensure at least one of Biome or ESLint is properly configured.',
    )
    return false
  }

  try {
    // Create a temporary file for the latest markdown
    const tempDir = os.tmpdir()
    const tempFile = path.join(tempDir, `rulens-${Date.now()}.md`)

    logger.info(`Generating temporary Markdown to ${tempFile}...`)

    // Generate markdown with available results
    const generateResult = await generateMarkdown({
      biomeResult,
      eslintResult,
      outputFile: tempFile,
    })

    if (generateResult.isErr()) {
      logger.error(`Error generating markdown: ${generateResult.error.message}`)
      return false
    }

    // Compare the generated file with existing file
    logger.info(`Comparing with existing file ${options.output}...`)
    const comparison = await compareWithFile(options.output, await fs.readFile(tempFile, 'utf-8'), {
      verbose: options.verbose,
    })

    return handleComparisonResult(comparison, options, tempFile, logger)
  } catch (error) {
    logger.error(
      `Error verifying lint rules: ${error instanceof Error ? error.message : String(error)}`,
    )
    throw error
  }
}
