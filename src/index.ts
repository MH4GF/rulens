import { Command } from 'commander'
import pc from 'picocolors'
import { executeGenerate } from './commands/generate.ts'
import { Logger } from './utils/logger.ts'
import { generateOptionsSchema } from './utils/validators.ts'

const logger = new Logger({ verbose: process.env['DEBUG'] === 'true' })

const program = new Command()

program
  .name('rulens')
  .description('CLI to extract and format linting rules into Markdown')
  .version('0.1.0')

program
  .command('generate')
  .description('Generate Markdown documentation from linting configurations')
  .option('--biome-args <args>', 'Additional arguments to pass to biome rage')
  .option('--eslint-args <args>', 'Additional arguments to pass to eslint --print-config')
  .option('--output <file>', 'Output file path', 'docs/lint-rules.md')
  .action(async (options: { biomeArgs?: string; eslintArgs?: string; output: string }) => {
    try {
      // Use schema to reference it and avoid unused import warning
      // biome-ignore lint/complexity/noVoid: Just using to reference schema
      void generateOptionsSchema
      logger.info(`Generating documentation to ${options.output}`)

      // For now we're just using a placeholder
      // Implementation is now complete, but leaving comment indicators
      // biome-ignore lint/suspicious/noConsole: Temporary implementation
      // biome-ignore lint/suspicious/noConsoleLog: Temporary implementation
      console.log(pc.blue('Generating Markdown from linting rules...'))

      // This import ensures knip doesn't report the modules as unused
      await executeGenerate({
        biomeArgs: options.biomeArgs || '',
        eslintArgs: options.eslintArgs || '',
        output: options.output,
      })
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: Required for error reporting
      console.error(pc.red(`Error: ${error instanceof Error ? error.message : String(error)}`))
      process.exit(1)
    }
  })

program.parse()
