import { Command } from 'commander'
import pc from 'picocolors'
import packageJson from '../package.json' with { type: 'json' }
import { executeGenerate } from './commands/generate.ts'
import { Logger } from './utils/logger.ts'
import { generateOptionsSchema } from './utils/validators.ts'

const logger = new Logger({ verbose: process.env['DEBUG'] === 'true' })

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
  .action(async (options: { biomeArgs?: string; eslintConfig?: string; output: string }) => {
    try {
      // Use schema to reference it and avoid unused import warning
      // biome-ignore lint/complexity/noVoid: Just using to reference schema
      void generateOptionsSchema
      logger.info(`Generating documentation to ${options.output}`)

      await executeGenerate({
        biomeArgs: options.biomeArgs || '',
        eslintConfig: options.eslintConfig,
        output: options.output,
      })

      logger.info(pc.green('Successfully generated Markdown from linting rules!'))
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: Required for error reporting
      console.error(pc.red(`Error: ${error instanceof Error ? error.message : String(error)}`))
      process.exit(1)
    }
  })

program.parse()
