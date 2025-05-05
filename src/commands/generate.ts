import { generateMarkdown } from '../markdown/generator.ts'
import { runBiomeRage } from '../tools/biome-runner.ts'
import { runESLintConfig } from '../tools/eslint-runner.ts'
import { Logger } from '../utils/logger.ts'
import type { GenerateOptions } from '../utils/validators.ts'

export async function executeGenerate(options: GenerateOptions): Promise<void> {
  // Override logger with verbose option if provided
  const logger = new Logger({ verbose: options.verbose ?? undefined })
  logger.info('Executing generate command...')

  try {
    logger.info('Fetching Biome configuration...')
    const biomeResult = await runBiomeRage({
      additionalArgs: options.biomeArgs,
      verbose: options.verbose ?? undefined,
    })
    logger.info(`Found ${Object.keys(biomeResult.rules).length} Biome rules`)

    logger.info('Fetching ESLint configuration using bundle-require...')
    const eslintResult = await runESLintConfig({
      configPath: options.eslintConfig,
      verbose: options.verbose ?? undefined,
    })

    const eslintRulesCount = Object.keys(eslintResult.rules).length
    const eslintMetaCount = Object.keys(eslintResult.rulesMeta).length
    logger.info(
      `Found ${eslintRulesCount} ESLint rules and ${eslintMetaCount} rule metadata entries`,
    )

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
