interface BiomeRunnerOptions {
  additionalArgs?: string
}

export interface BiomeRageResult {
  raw: string
  rules: string[]
}

export function runBiomeRage(_options: BiomeRunnerOptions = {}): Promise<BiomeRageResult> {
  // TODO: Implement the following steps:
  // 1. Use the bin-resolver to find the biome binary
  // 2. Use the executor to run the biome rage command with any additional args
  // 3. Parse the result and extract the rules

  return Promise.resolve({
    raw: '',
    rules: [],
  })
}
