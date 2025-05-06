import { execa } from 'execa'
import { ResultAsync, err, ok } from 'neverthrow'

interface ExecuteCommandOptions {
  command: string
  args: string[]
  cwd: string
  timeout?: number
}

type Stdout = string

/**
 * Executes a command and returns the result wrapped in a Result type.
 */
export function executeCommand(options: ExecuteCommandOptions): ResultAsync<Stdout, Error> {
  const { command, args = [], cwd = process.cwd(), timeout = 60000 } = options

  return ResultAsync.fromPromise(execa(command, args, { cwd, timeout, stdio: 'pipe' }), (error) =>
    error instanceof Error ? error : new Error(String(error)),
  ).andThen((result) => {
    if (result.exitCode !== 0 || result.stderr) {
      return err(new Error(`Command failed with exit code ${result.exitCode}, ${result.stderr}`))
    }

    return ok(result.stdout)
  })
}
