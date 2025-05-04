import fs from 'node:fs/promises'
import type { BiomeRageResult } from '../tools/biome-runner.ts'
import type { ESLintConfigResult } from '../tools/eslint-runner.ts'

interface MarkdownGeneratorOptions {
  biomeResult: BiomeRageResult
  eslintResult: ESLintConfigResult
  outputFile: string
}

export async function generateMarkdown(options: MarkdownGeneratorOptions): Promise<string> {
  const { biomeResult, eslintResult, outputFile } = options

  // Start generating markdown
  let markdown = '# Rulens Lint Rules Dump\n\n'

  // Add Biome section if available
  if (biomeResult) {
    markdown += '## Biome rules\n\n'
    // TODO: Format biome results
  }

  // Add ESLint section if available
  if (eslintResult) {
    markdown += '## ESLint rules\n\n'
    // TODO: Format eslint results
  }

  // Write to file
  await fs.writeFile(outputFile, markdown, 'utf-8')

  return markdown
}
