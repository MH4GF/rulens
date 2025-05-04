import { object, optional, record, safeParse, string, unknown } from 'valibot'
import { resolveBinary } from '../utils/bin-resolver.ts'
import { executeCommand } from '../utils/executor.ts'
import { Logger } from '../utils/logger.ts'

// ロガーのインスタンスを作成
const logger = new Logger()

interface ESLintRunnerOptions {
  additionalArgs?: string
  targetFile?: string
}

export interface ESLintConfigResult {
  raw: string
  rules: Record<string, unknown>
}

// ESLint出力のバリデーションスキーマ
const eslintOutputSchema = object({
  rules: optional(record(string(), unknown())),
})

/**
 * Runs the eslint --print-config command and returns the results
 * This command prints the configuration for a given file
 */
export async function runESLintConfig(
  options: ESLintRunnerOptions = {},
): Promise<ESLintConfigResult> {
  const { additionalArgs, targetFile = 'src/index.ts' } = options

  // 1. Use the bin-resolver to find the eslint binary
  const eslintBinary = await resolveBinary('eslint')

  // 2. Prepare command arguments
  const args = ['--print-config', targetFile]
  if (additionalArgs) {
    args.push(...additionalArgs.split(' ').filter(Boolean))
  }

  // 3. Use the executor to run the eslint command
  const result = await executeCommand({
    command: eslintBinary,
    args,
    cwd: process.cwd(),
  })

  // 4. Handle command execution errors
  if (result.exitCode !== 0) {
    throw new Error(`Failed to run eslint command: ${result.stderr || 'Unknown error'}`)
  }

  // 5. Parse the result and extract the rules
  const rules = parseESLintOutput(result.stdout)

  return {
    raw: result.stdout,
    rules,
  }
}

/**
 * Parses the raw JSON output from eslint --print-config command and extracts the rules
 */
export function parseESLintOutput(output: string): Record<string, unknown> {
  if (!output) {
    return {}
  }

  try {
    // valibotを使用してオブジェクトの構造を検証
    const result = safeParse(eslintOutputSchema, JSON.parse(output))

    if (result.success && result.output.rules) {
      return result.output.rules
    }

    logger.warn('ESLint output has no rules property or validation failed')
    return {}
  } catch (error) {
    logger.error(
      `Failed to parse ESLint output: ${error instanceof Error ? error.message : String(error)}`,
    )
    return {}
  }
}
