import { type ResultAsync, err } from 'neverthrow'
import { generateMarkdown } from '../markdown/generator.ts'
import { parseBiomeRules } from '../parsers/biome-parser.ts'
import { parseESLintRules } from '../parsers/eslint-parser.ts'
import { runBiomeRage } from '../tools/biome-runner.ts'
import { runESLintConfig } from '../tools/eslint-runner.ts'
import type { RulensLinter } from '../types/rulens.ts'
import { Logger } from '../utils/logger.ts'
import type { GenerateOptions } from '../utils/validators.ts'

export function executeGenerate(options: GenerateOptions): ResultAsync<string, Error> {
  // Override logger with verbose option if provided
  const logger = new Logger({ verbose: options.verbose ?? undefined })
  logger.info('Executing generate command...')

  const linters: RulensLinter[] = []

  return runBiomeRage({
    additionalArgs: options.biomeArgs ?? undefined,
    verbose: options.verbose ?? undefined,
  })
    .andTee((result) => {
      logger.info(`Found ${result.rules.length} Biome rules`)
      linters.push(parseBiomeRules(result))
    })
    .orTee((e) => {
      logger.warn(`Biome not found or failed to run: ${e.message}`)
      logger.info('Continuing without Biome rules...')
    })
    .andThen(() => {
      logger.info('Fetching ESLint configuration...')
      return runESLintConfig({
        configPath: options.eslintConfig ?? undefined,
        verbose: options.verbose ?? undefined,
      })
    })
    .andTee((result) => {
      const eslintRulesCount = Object.keys(result.rules).length
      const eslintMetaCount = Object.keys(result.rulesMeta).length
      logger.info(
        `Found ${eslintRulesCount} ESLint rules and ${eslintMetaCount} rule metadata entries`,
      )
      linters.push(parseESLintRules(result))
    })
    .orTee((e) => {
      logger.warn(`ESLint not found or failed to run: ${e.message}`)
      logger.info('Continuing without ESLint rules...')
    })
    .andThen(() => {
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
      })
    })
    .andTee(() => {
      logger.info('Markdown generation complete!')
    })
}
