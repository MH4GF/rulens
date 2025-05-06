import { ResultAsync, err } from 'neverthrow'
import { generateMarkdown } from '../markdown/generator.ts'
import { parseBiomeRules } from '../parsers/biome-parser.ts'
import { parseESLintRules } from '../parsers/eslint-parser.ts'
import { runBiomeRage } from '../tools/biome-runner.ts'
import { runESLintConfig } from '../tools/eslint-runner.ts'
import type { RulensLinter } from '../types/rulens.ts'
import { Logger } from '../utils/logger.ts'
import type { GenerateOptions } from '../utils/validators.ts'

export function executeGenerate(options: GenerateOptions): ResultAsync<void, Error> {
  // Override logger with verbose option if provided
  const logger = new Logger({ verbose: options.verbose ?? undefined })
  logger.info('Executing generate command...')

  // Use a ResultAsync to wrap the Promise chain
  return ResultAsync.fromPromise(
    Promise.resolve().then(async () => {
      const linters: RulensLinter[] = []

      // Try to run Biome
      await runBiomeRage({
        additionalArgs: options.biomeArgs ?? undefined,
        verbose: options.verbose ?? undefined,
      })
        .map((result) => {
          logger.info(`Found ${result.rules.length} Biome rules`)
          const biomeLinter = parseBiomeRules(result)
          linters.push(biomeLinter)
          return result
        })
        .mapErr((error) => {
          logger.warn(`Biome not found or failed to run: ${error.message}`)
          logger.info('Continuing without Biome rules...')
          return error
        })
        .unwrapOr(null)

      // Try to run ESLint, but don't fail if it's not available
      logger.info('Fetching ESLint configuration...')
      await runESLintConfig({
        configPath: options.eslintConfig,
        verbose: options.verbose ?? undefined,
      })
        .map((result) => {
          const eslintRulesCount = Object.keys(result.rules).length
          const eslintMetaCount = Object.keys(result.rulesMeta).length
          logger.info(
            `Found ${eslintRulesCount} ESLint rules and ${eslintMetaCount} rule metadata entries`,
          )
          const eslintLinter = parseESLintRules(result)
          linters.push(eslintLinter)
          return result
        })
        .mapErr((error) => {
          logger.warn(`ESLint not found or failed to run: ${error.message}`)
          logger.info('Continuing without ESLint rules...')
          return error
        })
        .unwrapOr(null)

      return { linters }
    }),
    (error) => new Error(String(error)),
  ).andThen(({ linters }) => {
    if (linters.length === 0) {
      return err(
        new Error(
          'No linter configurations found. Ensure at least one of Biome or ESLint is properly configured.',
        ),
      )
    }

    // Generate markdown with available results
    logger.info(`Generating Markdown output to ${options.output}...`)

    return generateMarkdown({
      linters,
      outputFile: options.output,
    }).map(() => {
      logger.info('Markdown generation complete!')
    })
  })
}
