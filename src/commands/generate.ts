import { generateMarkdown } from '../markdown/generator.ts'
import type { BiomeRageResult } from '../tools/biome-runner.ts'
import { runBiomeRage } from '../tools/biome-runner.ts'
import type { ESLintConfigResult } from '../tools/eslint-runner.ts'
import { runESLintConfig } from '../tools/eslint-runner.ts'
import { Logger } from '../utils/logger.ts'
import type { GenerateOptions } from '../utils/validators.ts'

export async function executeGenerate(options: GenerateOptions): Promise<void> {
  // Override logger with verbose option if provided
  const logger = new Logger({ verbose: options.verbose ?? undefined })
  logger.info('Executing generate command...')

  // Initialize results as null (will be updated if tools are found)
  let biomeResult: BiomeRageResult | null = null
  let eslintResult: ESLintConfigResult | null = null

  // Try to run Biome, but don't fail if it's not available
  try {
    logger.info('Fetching Biome configuration...')
    biomeResult = await runBiomeRage({
      additionalArgs: options.biomeArgs ?? undefined,
      verbose: options.verbose ?? undefined,
    })
    logger.info(`Found ${Object.keys(biomeResult.rules).length} Biome rules`)
  } catch (error) {
    // Handle case where Biome is not installed
    logger.warn(
      `Biome not found or failed to run: ${error instanceof Error ? error.message : String(error)}`,
    )
    logger.info('Continuing without Biome rules...')
  }

  // Try to run ESLint, but don't fail if it's not available
  try {
    logger.info('Fetching ESLint configuration using bundle-require...')
    eslintResult = await runESLintConfig({
      configPath: options.eslintConfig,
      verbose: options.verbose ?? undefined,
    })

    const eslintRulesCount = Object.keys(eslintResult.rules).length
    const eslintMetaCount = Object.keys(eslintResult.rulesMeta).length
    logger.info(
      `Found ${eslintRulesCount} ESLint rules and ${eslintMetaCount} rule metadata entries`,
    )
  } catch (error) {
    // Handle case where ESLint is not installed
    logger.warn(
      `ESLint not found or failed to run: ${error instanceof Error ? error.message : String(error)}`,
    )
    logger.info('Continuing without ESLint rules...')
  }

  // Check if we have any results to generate
  if (!(biomeResult || eslintResult)) {
    logger.warn(
      'No linter configurations found. Ensure at least one of Biome or ESLint is properly configured.',
    )
    logger.info('Markdown generation skipped.')
    return
  }

  try {
    // Generate markdown with available results
    logger.info(`Generating Markdown output to ${options.output}...`)
    await generateMarkdown({
      biomeResult,
      eslintResult,
      outputFile: options.output,
    })

    logger.info('Markdown generation complete!')
  } catch (error) {
    logger.error(
      `Error generating lint rules: ${error instanceof Error ? error.message : String(error)}`,
    )
    throw error
  }
}
