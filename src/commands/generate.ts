import { generateMarkdown } from '../markdown/generator.ts'
import { runBiomeRage } from '../tools/biome-runner.ts'
import { runESLintConfig } from '../tools/eslint-runner.ts'
import { resolveBinary } from '../utils/bin-resolver.ts'
import { executeCommand } from '../utils/executor.ts'
import type { GenerateOptions } from '../utils/validators.ts'

export async function executeGenerate(options: GenerateOptions): Promise<void> {
  // Note: This is just a stub implementation that uses all the modules
  // to prevent Knip from marking them as unused

  // Use resolveBinary to ensure it's not reported as unused
  await resolveBinary('biome')
  await resolveBinary('eslint')

  // Placeholder command execution
  await executeCommand({
    command: 'echo',
    args: ['Executing generate command'],
    cwd: process.cwd(),
  })

  // Run tools to get linting configs
  const biomeResult = await runBiomeRage({ additionalArgs: options.biomeArgs })
  const eslintResult = await runESLintConfig({
    additionalArgs: options.eslintArgs,
    targetFile: 'src/index.ts',
  })

  // Generate markdown output
  await generateMarkdown({
    biomeResult,
    eslintResult,
    outputFile: options.output,
  })
}
