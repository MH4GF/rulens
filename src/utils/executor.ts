import { execa } from 'execa'

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

export async function executeCommand(
  options: ExecuteCommandOptions,
): Promise<ExecuteCommandResult> {
  const { command, args = [], cwd = process.cwd(), timeout = 60000 } = options

  try {
    const result = await execa(command, args, {
      cwd,
      timeout,
      stdio: 'pipe',
      reject: false,
    })

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode || 0,
    }
  } catch (error) {
    if (error instanceof Error) {
      return {
        stdout: '',
        stderr: error.message,
        exitCode: 1,
      }
    }

    return {
      stdout: '',
      stderr: 'Unknown error occurred',
      exitCode: 1,
    }
  }
}
