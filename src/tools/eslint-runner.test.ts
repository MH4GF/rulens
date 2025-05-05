import { describe, expect, it } from 'vitest'
import { extractRulesAndMeta, runESLintConfig } from './eslint-runner.ts'

// トップレベルに正規表現を定義
const CONFIG_FILE_NOT_FOUND_REGEX = /ESLint config file not found/

describe('eslint-runner', () => {
  describe('runESLintConfig', () => {
    // 設定ファイルパスを指定するテスト
    it('should load ESLint config using bundle-require and return the expected result structure', async () => {
      // eslintの設定ファイルパスを指定
      const configPath = 'eslint.config.js' // デフォルト設定ファイル名

      // 実際に設定を読み込む
      const result = await runESLintConfig({ configPath })

      // 期待される結果構造を確認
      expect(result).toHaveProperty('raw')
      expect(result).toHaveProperty('rules')
      expect(result).toHaveProperty('rulesMeta')

      // このプロジェクトのESLint設定にルールが含まれていることを確認
      expect(Object.keys(result.rules).length).toBeGreaterThan(0)

      // メタデータが正しく抽出されていることを確認
      expect(Object.keys(result.rulesMeta).length).toBeGreaterThan(0)
    })

    // 存在しない設定ファイルを指定した場合のエラーテスト
    it('should throw an error if the specified config file does not exist', async () => {
      const nonExistentConfigPath = 'non-existent-config.js'

      await expect(runESLintConfig({ configPath: nonExistentConfigPath })).rejects.toThrow(
        CONFIG_FILE_NOT_FOUND_REGEX,
      )
    })
  })

  describe('extractRulesAndMeta', () => {
    // ルールとメタデータの抽出をテスト
    it('should extract rules and metadata from ESLint config object', () => {
      // モックESLint設定オブジェクト
      const mockConfig = [
        {
          // ルール設定
          rules: {
            'no-console': 'error',
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
          },
        },
        {
          // プラグイン設定
          plugins: {
            '@typescript-eslint': {
              rules: {
                'no-explicit-any': {
                  meta: {
                    type: 'problem',
                    docs: {
                      description: 'Disallow the `any` type',
                      url: 'https://typescript-eslint.io/rules/no-explicit-any',
                    },
                  },
                },
              },
            },
          },
        },
      ]

      // ルールとメタデータを抽出
      const { rules, rulesMeta } = extractRulesAndMeta(mockConfig)

      // ルールが正しく抽出されていることを確認
      expect(rules).toHaveProperty('no-console', 'error')
      expect(rules).toHaveProperty('no-unused-vars')

      // メタデータが正しく抽出されていることを確認
      expect(rulesMeta).toHaveProperty('@typescript-eslint/no-explicit-any')
      expect(rulesMeta['@typescript-eslint/no-explicit-any']).toEqual({
        description: 'Disallow the `any` type',
        url: 'https://typescript-eslint.io/rules/no-explicit-any',
        recommended: false,
        type: 'problem',
      })
    })

    // 空のコンフィグオブジェクトを処理できることを確認
    it('should handle empty config objects', () => {
      const emptyConfig = {}
      const { rules, rulesMeta } = extractRulesAndMeta(emptyConfig)

      expect(rules).toEqual({})
      expect(rulesMeta).toEqual({})
    })

    // 複雑なネストされた設定を処理できることを確認
    it('should handle nested config objects with configs property', () => {
      const nestedConfig = [
        {
          plugins: {
            'plugin-name': {
              configs: {
                recommended: {
                  plugins: {
                    'nested-plugin': {
                      rules: {
                        'nested-rule': {
                          meta: {
                            type: 'suggestion',
                            docs: {
                              description: 'A nested rule description',
                              url: 'https://example.com/rules/nested-rule',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ]

      const { rulesMeta } = extractRulesAndMeta(nestedConfig)

      expect(rulesMeta).toHaveProperty('nested-plugin/nested-rule')
      expect(rulesMeta['nested-plugin/nested-rule']?.description).toBe('A nested rule description')
    })
  })
})
