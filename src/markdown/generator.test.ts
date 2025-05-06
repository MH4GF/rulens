import fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import type { RulensLinter } from '../types/rulens.ts'
import { generateMarkdownContent, writeMarkdownToFile } from './generator.ts'

describe('generateMarkdownContent', () => {
  // 純粋な関数のテスト - モックは不要
  it('should generate markdown content with both Biome and ESLint results', () => {
    const biomeLinter: RulensLinter = {
      name: 'Biome',
      categories: [],
    }
    const eslintLinter: RulensLinter = {
      name: 'ESLint',
      categories: [],
    }

    const content = generateMarkdownContent({
      linters: [biomeLinter, eslintLinter],
    })

    // 基本的な構造の検証
    expect(content).toContain('# Project Lint Rules Reference')
    expect(content).toContain('## 📑 Table of Contents')
    expect(content).toContain('## 📖 Introduction')
    expect(content).toContain('## 🤖 AI Usage Guide')
    expect(content).toContain('[Biome Rules](#biome-rules)')
    expect(content).toContain('[ESLint Rules](#eslint-rules)')
  })

  it('should generate markdown content with only Biome results', () => {
    const biomeLinter: RulensLinter = {
      name: 'Biome',
      categories: [],
    }

    const content = generateMarkdownContent({
      linters: [biomeLinter],
    })

    expect(content).toContain('# Project Lint Rules Reference')
    expect(content).toContain('[Biome Rules](#biome-rules)')
    expect(content).not.toContain('[ESLint Rules](#eslint-rules)')
  })

  it('should generate markdown content with only ESLint results', () => {
    const eslintLinter: RulensLinter = {
      name: 'ESLint',
      categories: [],
    }

    const content = generateMarkdownContent({
      linters: [eslintLinter],
    })

    expect(content).toContain('# Project Lint Rules Reference')
    expect(content).not.toContain('[Biome Rules](#biome-rules)')
    expect(content).toContain('[ESLint Rules](#eslint-rules)')
  })

  it('should generate basic markdown content with empty linters array', () => {
    const content = generateMarkdownContent({
      linters: [],
    })

    expect(content).toContain('# Project Lint Rules Reference')
    expect(content).toContain('## 📑 Table of Contents')
    expect(content).not.toContain('[Biome Rules](#biome-rules)')
    expect(content).not.toContain('[ESLint Rules](#eslint-rules)')
  })
})

// ファイルシステム操作のテストはスキップ
// 実際のファイルシステムに依存するため、CI環境では不安定になる可能性がある
describe('writeMarkdownToFile', () => {
  // 一時ディレクトリを使用してファイルシステム操作をテスト
  it('should write content to a file', async () => {
    const tempDir = path.join(tmpdir(), `rulens-test-${Date.now()}`)
    const outputFile = path.join(tempDir, 'output.md')
    const content = '# Test Content'

    // ファイル書き込み
    const result = await writeMarkdownToFile(outputFile, content)

    // 成功したことを検証
    expect(result.isOk()).toBe(true)

    // 本当に書き込まれたか確認（実際のファイルシステム操作）
    const fileContent = await fs.readFile(outputFile, 'utf-8')
    expect(fileContent).toBe(content)

    // クリーンアップ
    await fs.rm(tempDir, { recursive: true, force: true })
  })
})
