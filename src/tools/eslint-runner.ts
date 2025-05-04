interface ESLintRunnerOptions {
  additionalArgs?: string
  targetFile?: string
}

export interface ESLintConfigResult {
  raw: string
  rules: Record<string, unknown>
}

export function runESLintConfig(_options: ESLintRunnerOptions = {}): Promise<ESLintConfigResult> {
  // TODO: Implement the following steps:
  // 1. Use the bin-resolver to find the eslint binary
  // 2. Determine a target file to run eslint --print-config on
  // 3. Use the executor to run the eslint command with any additional args
  // 4. Parse the result and extract the rules

  return Promise.resolve({
    raw: '',
    rules: {},
  })
}
