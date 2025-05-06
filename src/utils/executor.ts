import { execa } from 'execa'
import { type Result, ResultAsync, ok } from 'neverthrow'

interface ExecuteCommandOptions {
  command: string
  args: string[]
  cwd: string
  timeout?: number
}

interface ExecuteCommandResult {
  stdout: string
  stderr: string
  exitCode: number
}

/**
 * Executes a command and returns the result wrapped in a Result type.
 * The result is always OK, but the ExecuteCommandResult contains error information if the command fails.
 */
export async function executeCommand(
  options: ExecuteCommandOptions,
): Promise<Result<ExecuteCommandResult, Error>> {
  const { command, args = [], cwd = process.cwd(), timeout = 60000 } = options

  // Create a ResultAsync to handle the execa command
  const execaCommand = ResultAsync.fromPromise(
    execa(command, args, {
      cwd,
      timeout,
      stdio: 'pipe',
      reject: false,
    }),
  )

  // Process the result
  return execaCommand
    .map((result) => {
      return {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode || 0,
      }
    })
    .orElse((error) => {
      // Return a successful Result with error information in the ExecuteCommandResult
      return ok({
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error),
        exitCode: 1,
      })
    })
}
