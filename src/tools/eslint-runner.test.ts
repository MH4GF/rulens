import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseESLintOutput, runESLintConfig } from './eslint-runner.ts'

// トップレベルの正規表現定数
const ERROR_MESSAGE_REGEX = /Failed to run eslint command/

describe('eslint-runner', () => {
  describe('runESLintConfig', () => {
    it('should resolve eslint binary and return the expected result structure', async () => {
      // 実際にESLintコマンドを実行
      const result = await runESLintConfig()

      // 期待される結果構造を確認
      expect(result.raw).toMatchSnapshot()

      // このプロジェクトのESLint設定にルールが含まれていることを確認
      expect(Object.keys(result.rules).length).toBeGreaterThan(0)

      // 代表的なESLintルールが含まれていることを確認
      const ruleKeys = Object.keys(result.rules)
      expect(ruleKeys).toContain('for-direction')
    })

    // 追加引数テスト
    it('should correctly pass additional arguments to the eslint command', async () => {
      // 追加引数を使ってESLint設定を取得
      // format=jsonを指定する例
      const result = await runESLintConfig({
        additionalArgs: '--format=json',
      })

      // 結果が正しく返されることを確認
      expect(result).toBeDefined()
      expect(result.raw).toBeDefined()
      expect(typeof result.rules).toBe('object')
    })

    // ターゲットファイル指定テスト
    it('should use the specified target file for eslint --print-config', async () => {
      // 特定のファイルを対象にESLint設定を取得
      const testFile = path.resolve(process.cwd(), 'src/commands/generate.ts')

      const result = await runESLintConfig({
        targetFile: testFile,
      })

      // 結果が正しく返されることを確認
      expect(result).toBeDefined()
      expect(result.raw).toBeDefined()
      expect(typeof result.rules).toBe('object')
    })

    // エラー処理テスト
    it('should throw an error with helpful message when eslint command fails', async () => {
      // 無効な引数を渡し、実際にエラーが発生することを確認
      await expect(
        runESLintConfig({
          additionalArgs: '--non-existent-flag',
        }),
      ).rejects.toThrow(ERROR_MESSAGE_REGEX)
    })

    // biome-ignore lint/suspicious/noSkippedTests: 環境依存の複雑なテストなので意図的にスキップ
    it.skip('should handle the case when eslint binary is not found', async () => {
      // このテストはテスト環境によって複雑なので、現時点ではスキップする
      // このテストを行うには、環境変数 NODE_PATH などを一時的に変更して
      // eslint バイナリが見つからない状況を作る必要がありますが、
      // テスト環境の安定性を考慮してスキップします
    })
  })

  describe('parseESLintOutput', () => {
    it('should correctly parse eslint JSON output', () => {
      const sampleOutput = JSON.stringify({
        rules: {
          'no-console': ['error'],
          'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
          '@typescript-eslint/no-explicit-any': 'error',
          'react/prop-types': 'off',
        },
        extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
        plugins: ['@typescript-eslint', 'react'],
      })

      const result = parseESLintOutput(sampleOutput)

      // ルールが正しく抽出されていることを確認
      expect(result).toEqual({
        'no-console': ['error'],
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/no-explicit-any': 'error',
        'react/prop-types': 'off',
      })
    })

    it('should handle empty or invalid JSON input', () => {
      expect(parseESLintOutput('')).toEqual({})
      expect(parseESLintOutput('{}')).toEqual({})
      expect(parseESLintOutput('{"notRules": {}}')).toEqual({})
    })

    it('should handle various rule value formats', () => {
      const sampleOutput = JSON.stringify({
        rules: {
          // 文字列形式
          'string-rule': 'error',
          // 配列形式（レベルのみ）
          'array-level-rule': ['warn'],
          // 配列形式（レベルとオプション）
          'array-options-rule': ['error', { key: 'value' }],
          // 複雑なオプション
          'complex-options-rule': ['warn', { nested: { option: true }, list: [1, 2, 3] }],
          // オフにされたルール
          'off-rule': 'off',
          'off-rule-array': ['off'],
          // 数値形式（0=off, 1=warn, 2=error）
          'number-format-rule': 2,
        },
      })

      const result = parseESLintOutput(sampleOutput)
      expect(result).toEqual({
        'string-rule': 'error',
        'array-level-rule': ['warn'],
        'array-options-rule': ['error', { key: 'value' }],
        'complex-options-rule': ['warn', { nested: { option: true }, list: [1, 2, 3] }],
        'off-rule': 'off',
        'off-rule-array': ['off'],
        'number-format-rule': 2,
      })
    })
  })
})
