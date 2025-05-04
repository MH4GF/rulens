import fs from 'node:fs/promises'
import type { BiomeRageResult } from '../tools/biome-runner.ts'
import type { ESLintConfigResult } from '../tools/eslint-runner.ts'
import { biomeRulesToMarkdown } from './biome-to-markdown.ts'
import { eslintRulesToMarkdown } from './eslint-to-markdown.ts'

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
    markdown += biomeRulesToMarkdown(biomeResult)
  }

  // Add ESLint section if available
  if (eslintResult) {
    markdown += eslintRulesToMarkdown(eslintResult)
  }

  // Write to file
  await fs.writeFile(outputFile, markdown, 'utf-8')

  return markdown
}
