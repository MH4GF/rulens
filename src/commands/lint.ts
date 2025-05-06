import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { ResultAsync as RA, ResultAsync, err } from 'neverthrow'
import { generateMarkdown } from '../markdown/generator.ts'
import type { BiomeRageResult } from '../tools/biome-runner.ts'
import { runBiomeRage } from '../tools/biome-runner.ts'
import type { ESLintConfigResult } from '../tools/eslint-runner.ts'
import { runESLintConfig } from '../tools/eslint-runner.ts'
import { compareWithFile, updateFile } from '../utils/diff-utils.ts'
import { Logger } from '../utils/logger.ts'
import type { LintOptions } from '../utils/validators.ts'

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
function handleComparisonResult(
  comparison: { identical: boolean },
  options: Pick<LintOptions, 'output' | 'update'>,
  tempFile: string,
  logger: Logger,
): ResultAsync<boolean, Error> {
  if (comparison.identical) {
    logger.info('✅ Lint rules documentation is up-to-date!')
    // Clean up temp file
    return RA.fromPromise(
      fs.unlink(tempFile),
      (error) => new Error(`Failed to delete temp file: ${String(error)}`),
    ).map(() => true)
  }

  logger.warn('❌ Lint rules documentation is out of date!')

  if (options.update) {
    logger.info('Updating documentation file...')
    return RA.fromPromise(
      fs.readFile(tempFile, 'utf-8'),
      (error) => new Error(`Failed to read temp file: ${String(error)}`),
    )
      .andThen((content) => updateFile(options.output, content))
      .andThen(() => {
        logger.info(`✅ Documentation updated at ${options.output}`)
        return RA.fromPromise(
          fs.unlink(tempFile),
          (error) => new Error(`Failed to delete temp file: ${String(error)}`),
        )
      })
      .map(() => false)
  }

  logger.info('Run with --update to update the documentation automatically')
  logger.info('or run `rulens generate` to update it manually')

  // Clean up temp file
  return RA.fromPromise(
    fs.unlink(tempFile),
    (error) => new Error(`Failed to delete temp file: ${String(error)}`),
  ).map(() => false)
}

/**
 * Checks if the generated markdown file is up-to-date
 * If not, returns false and optionally updates the file
 */
export function executeLint(options: LintOptions): ResultAsync<boolean, Error> {
  const logger = new Logger({ verbose: options.verbose })
  logger.info(`Verifying documentation at ${options.output}`)
  logger.info('Executing lint command...')

  // Check if the output file exists
  if (!existsSync(options.output)) {
    logger.error(`Output file ${options.output} does not exist. Run 'rulens generate' first.`)
    return RA.fromPromise(Promise.resolve(false), () => new Error('Output file does not exist'))
  }

  // Use a ResultAsync to wrap the Promise chain
  return ResultAsync.fromPromise(
    Promise.resolve().then(async () => {
      const biomeResult = await fetchBiomeConfig(options, logger)
        .mapErr((error) => {
          logger.warn(`Biome not found or failed to run: ${error.message}`)
          logger.info('Continuing without Biome rules...')
          return error
        })
        .unwrapOr(null)

      const eslintResult = await fetchESLintConfig(options, logger)
        .mapErr((error) => {
          logger.warn(`ESLint not found or failed to run: ${error.message}`)
          logger.info('Continuing without ESLint rules...')
          return error
        })
        .unwrapOr(null)

      return { biomeResult, eslintResult }
    }),
    (error) => new Error(`Failed to fetch linter configurations: ${String(error)}`),
  )
    .andThen(({ biomeResult, eslintResult }) => {
      // Check if we have any results to generate
      if (!(biomeResult || eslintResult)) {
        logger.warn(
          'No linter configurations found. Ensure at least one of Biome or ESLint is properly configured.',
        )
        return RA.fromPromise(
          Promise.resolve(false),
          () => new Error('No linter configurations found'),
        )
      }

      // Create a temporary file for the latest markdown
      const tempDir = os.tmpdir()
      const tempFile = path.join(tempDir, `rulens-${Date.now()}.md`)

      logger.info(`Generating temporary Markdown to ${tempFile}...`)

      // Generate markdown with available results
      return generateMarkdown({
        biomeResult,
        eslintResult,
        outputFile: tempFile,
      })
        .andThen(() => {
          // Compare the generated file with existing file
          logger.info(`Comparing with existing file ${options.output}...`)
          return RA.fromPromise(
            fs.readFile(tempFile, 'utf-8'),
            (error) => new Error(`Failed to read temp file: ${String(error)}`),
          )
            .andThen((tempContent) => {
              return compareWithFile(options.output, tempContent, {
                verbose: options.verbose,
              })
            })
            .andThen((comparison) => {
              // Handle the comparison result
              return handleComparisonResult(comparison, options, tempFile, logger)
            })
        })
        .orElse((error) => {
          logger.error(`Error generating markdown: ${error.message}`)
          return RA.fromPromise(Promise.resolve(false), () => error)
        })
    })
    .orElse((error: Error) => {
      logger.error(`Error verifying lint rules: ${error.message}`)
      return err(error)
    })
}
