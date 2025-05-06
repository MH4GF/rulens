import fs from 'node:fs/promises'
import path from 'node:path'
import type { Result } from 'neverthrow'
import { ResultAsync, ok } from 'neverthrow'

/**
 * Binary resolution strategy:
 * 1. First look in local node_modules/.bin
 * 2. Fall back to global command
 */
export async function resolveBinary(name: string): Promise<Result<string, Error>> {
  const localBin = path.resolve(process.cwd(), 'node_modules', '.bin', name)

  const fsAccess = ResultAsync.fromThrowable(() => fs.access(localBin, fs.constants.X_OK))
  const binResult = await fsAccess()

  if (binResult.isOk()) {
    return ok(localBin)
  }

  // Fallback to global command
  return ok(name)
}
