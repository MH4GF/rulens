import { Command } from 'commander'
import pc from 'picocolors'
import packageJson from '../package.json' with { type: 'json' }
import { executeGenerate } from './commands/generate.ts'
import { executeLint } from './commands/lint.ts'
import { Logger } from './utils/logger.ts'
import type { GenerateOptions, LintOptions } from './utils/validators.ts'

const logger = new Logger({
  verbose: process.env['VERBOSE'] === 'true',
})

const program = new Command()

program
  .name('rulens')
  .description('CLI to extract and format linting rules into Markdown')
  .version(packageJson.version)

program
  .command('generate')
  .description('Generate Markdown documentation from linting configurations')
  .option('--biome-args <args>', 'Additional arguments to pass to biome rage')
  .option('--eslint-config <path>', 'Path to ESLint config file (default: eslint.config.js)')
  .option('--output <file>', 'Output file path', 'docs/lint-rules.md')
  .option('--verbose', 'Enable verbose logging with detailed information and object dumps')
  .action(async (options: GenerateOptions) => {
    await executeGenerate(options).match(
      () => {
        logger.info(pc.green('Successfully generated Markdown from linting rules!'))
      },
      (error) => {
        logger.error(pc.red(`Error: ${error.message}`))
        process.exit(1)
      },
    )
  })

program
  .command('lint')
  .description('Verify that Markdown documentation matches current linting configurations')
  .option('--biome-args <args>', 'Additional arguments to pass to biome rage')
  .option('--eslint-config <path>', 'Path to ESLint config file (default: eslint.config.js)')
  .option('--output <file>', 'Output file path to verify', 'docs/lint-rules.md')
  .option('--update', "Update the output file if it's out of date")
  .option('--verbose', 'Enable verbose logging with detailed information and differences')
  .action(async (options: LintOptions) => {
    await executeLint(options).match(
      (isValid) => {
        if (isValid) {
          logger.info(pc.green('Documentation is up-to-date!'))
          process.exit(0)
        } else {
          if (options.update) {
            logger.info(pc.yellow('Documentation was out of date but has been updated.'))
          } else {
            logger.error(pc.red('Documentation is out of date! Run with --update to update it.'))
          }
          process.exit(1) // Exit with error for CI pipelines to detect
        }
      },
      (error) => {
        logger.error(pc.red(`Error: ${error.message}`))
        process.exit(1)
      },
    )
  })

program.parse()
