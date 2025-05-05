import { resolveBinary } from '../utils/bin-resolver.ts'
import { executeCommand } from '../utils/executor.ts'

interface BiomeRunnerOptions {
  additionalArgs?: string
}

export interface BiomeRageResult {
  raw: string
  rules: string[]
}

/**
 * Runs the biome rage command and returns the results
 * This command lists all available rules in the current Biome configuration
 */
export async function runBiomeRage(options: BiomeRunnerOptions = {}): Promise<BiomeRageResult> {
  const { additionalArgs } = options

  const biomeBinary = await resolveBinary('biome')

  const args = ['rage', '--linter']
  if (additionalArgs) {
    args.push(...additionalArgs.split(' ').filter(Boolean))
  }

  const result = await executeCommand({
    command: biomeBinary,
    args,
    cwd: process.cwd(),
  })

  if (result.exitCode !== 0) {
    throw new Error(`Failed to run biome rage command: ${result.stderr || 'Unknown error'}`)
  }
  const rules = parseRules(result.stdout)

  return {
    raw: result.stdout,
    rules,
  }
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
