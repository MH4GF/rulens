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
  logger.info('Fetching Biome configuration...')
  const biomeRageResult = await runBiomeRage({
    additionalArgs: options.biomeArgs ?? undefined,
    verbose: options.verbose ?? undefined,
  })

  if (biomeRageResult.isOk()) {
    biomeResult = biomeRageResult.value
    logger.info(`Found ${biomeResult.rules.length} Biome rules`)
  } else {
    // Handle case where Biome is not installed
    logger.warn(`Biome not found or failed to run: ${biomeRageResult.error.message}`)
    logger.info('Continuing without Biome rules...')
  }

  // Try to run ESLint, but don't fail if it's not available
  logger.info('Fetching ESLint configuration using bundle-require...')
  const eslintRageResult = await runESLintConfig({
    configPath: options.eslintConfig,
    verbose: options.verbose ?? undefined,
  })

  if (eslintRageResult.isOk()) {
    eslintResult = eslintRageResult.value
    const eslintRulesCount = Object.keys(eslintResult.rules).length
    const eslintMetaCount = Object.keys(eslintResult.rulesMeta).length
    logger.info(
      `Found ${eslintRulesCount} ESLint rules and ${eslintMetaCount} rule metadata entries`,
    )
  } else {
    // Handle case where ESLint is not installed
    logger.warn(`ESLint not found or failed to run: ${eslintRageResult.error.message}`)
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

  // Generate markdown with available results
  logger.info(`Generating Markdown output to ${options.output}...`)

  await generateMarkdown({
    biomeResult,
    eslintResult,
    outputFile: options.output,
  }).match(
    () => {
      logger.info('Markdown generation complete!')
    },
    (error) => {
      logger.error(
        `Error generating lint rules: ${error instanceof Error ? error.message : String(error)}`,
      )
      throw error // Re-throw to maintain the same error behavior
    },
  )
}
