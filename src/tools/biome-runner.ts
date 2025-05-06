import type { ResultAsync } from 'neverthrow'
import { resolveBinary } from '../utils/bin-resolver.ts'
import { executeCommand } from '../utils/executor.ts'
import { Logger } from '../utils/logger.ts'

interface BiomeRunnerOptions {
  additionalArgs?: string | undefined
  verbose?: boolean | undefined
}

export interface BiomeRageResult {
  raw: string
  rules: string[]
}

/**
 * Runs the biome rage command and returns the results
 * This command lists all available rules in the current Biome configuration
 */
export function runBiomeRage(
  options: BiomeRunnerOptions = {},
): ResultAsync<BiomeRageResult, Error> {
  const { additionalArgs, verbose } = options
  const logger = new Logger({ verbose: verbose ?? undefined })

  // Create args array outside the chain
  const args = ['rage', '--linter']
  if (additionalArgs) {
    args.push(...additionalArgs.split(' ').filter(Boolean))
  }

  return resolveBinary('biome')
    .andThen((binary) => executeCommand({ command: binary, args, cwd: process.cwd() }))
    .map((stdout) => {
      logger.dump('Biome rage output', stdout)
      const rules = parseRules(stdout)
      return { raw: stdout, rules }
    })
}

/**
 * Parses the raw output from biome rage command and extracts the rule IDs
 */
function parseRules(output: string): string[] {
  const lines = output.split('\n')
  const rules: string[] = []

  let inRulesSection = false

  for (const line of lines) {
    const trimmedLine = line.trim()

    // Check for the "Enabled rules:" section header (in the Linter section)
    if (trimmedLine === 'Enabled rules:') {
      inRulesSection = true
      continue
    }
    if (inRulesSection && (trimmedLine === '' || trimmedLine.includes(':'))) {
      // End of rules section when we hit empty line or a new section (contains ':')
      inRulesSection = false
      continue
    }

    // Once we're in the rules section, extract rule IDs
    if (inRulesSection && trimmedLine.length > 0) {
      // In the actual output format, rule IDs are listed directly with no prefix
      // Example: "suspicious/noCatchAssign"
      rules.push(trimmedLine)
    }
  }

  return rules
}
