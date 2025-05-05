import fs from 'node:fs/promises'
import { parseBiomeRules } from '../parsers/biome-parser.ts'
import { parseESLintRules } from '../parsers/eslint-parser.ts'
import type { BiomeRageResult } from '../tools/biome-runner.ts'
import type { ESLintConfigResult } from '../tools/eslint-runner.ts'
import { lintRulesToMarkdown } from './lint-to-markdown.ts'

interface MarkdownGeneratorOptions {
  biomeResult: BiomeRageResult
  eslintResult: ESLintConfigResult
  outputFile: string
}

export async function generateMarkdown(options: MarkdownGeneratorOptions): Promise<string> {
  const { biomeResult, eslintResult, outputFile } = options

  // Start generating markdown
  let markdown = '# Rulens Lint Rules Dump\n\n'

  // 1. Biome設定を共通中間表現に変換
  if (biomeResult) {
    const biomeLinter = parseBiomeRules(biomeResult)
    markdown += `${lintRulesToMarkdown(biomeLinter)}\n`
  }

  // 2. ESLint設定を共通中間表現に変換
  if (eslintResult) {
    const eslintLinter = parseESLintRules(eslintResult)
    markdown += lintRulesToMarkdown(eslintLinter)
  }

  // Write to file
  await fs.writeFile(outputFile, markdown, 'utf-8')

  return markdown
}
