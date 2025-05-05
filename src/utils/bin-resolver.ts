import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * Binary resolution strategy:
 * 1. First look in local node_modules/.bin
 * 2. Fall back to global command
 */
export async function resolveBinary(name: string): Promise<string> {
  const localBin = path.resolve(process.cwd(), 'node_modules', '.bin', name)

  try {
    await fs.access(localBin, fs.constants.X_OK)
    return localBin
  } catch {
    return name
  }
}
