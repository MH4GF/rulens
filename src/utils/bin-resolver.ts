import fs from 'node:fs/promises'
import path from 'node:path'
import { ResultAsync, ok } from 'neverthrow'

/**
 * Binary resolution strategy:
 * 1. First look in local node_modules/.bin
 * 2. Fall back to global command
 */
export function resolveBinary(name: string): ResultAsync<string, never> {
  const localBin = path.resolve(process.cwd(), 'node_modules', '.bin', name)

  const fsAccess = ResultAsync.fromThrowable(() => fs.access(localBin, fs.constants.X_OK))
  return fsAccess()
    .andThen(() => ok(localBin))
    .orElse(() => ok(name))
}
