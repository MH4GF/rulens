import { existsSync } from 'node:fs'
import path from 'node:path'
import { bundleRequire } from 'bundle-require'
import { object, optional, record, safeParse, string, unknown } from 'valibot'
import { Logger } from '../utils/logger.ts'

// ロガーのインスタンスを作成
const logger = new Logger()

/**
 * 循環参照を処理するためのカスタムJSON stringify関数
 */
function safeStringify(obj: unknown): string {
  const seen = new Set()
  return JSON.stringify(
    obj,
    (_key, value: unknown) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]'
        }
        seen.add(value)
      }
      return value
    },
    2,
  )
}

// ESLint設定取得オプション
interface ESLintRunnerOptions {
  configPath?: string | undefined // ESLint設定ファイルのパス（デフォルト：eslint.config.js）
}

// ESLintルールのメタデータを表す型
interface ESLintRuleMeta {
  description?: string | undefined // ルールの説明
  url?: string | undefined // ドキュメントURL
  recommended?: boolean | undefined // 推奨ルールかどうか
  type?: string | undefined // ルールの種類（例: "problem", "suggestion", "layout"）
}

// ESLint実行結果の型定義
export interface ESLintConfigResult {
  raw: string
  rules: Record<string, unknown>
  rulesMeta: Record<string, ESLintRuleMeta>
  pluginsMetadata?: Record<string, { name: string; description?: string }>
}

// bundle-requireの結果のバリデーションスキーマ
const bundleResultSchema = object({
  mod: optional(record(string(), unknown())),
  default: optional(unknown()),
})

// ESLint設定のバリデーションスキーマ
const eslintDocsSchema = object({
  description: optional(string()),
  url: optional(string()),
  recommended: optional(unknown()),
})

const eslintMetaSchema = object({
  type: optional(string()),
  docs: optional(eslintDocsSchema),
})

const eslintRuleSchema = object({
  meta: optional(eslintMetaSchema),
})

/**
 * ESLint設定をbundle-requireを使って読み込む
 */
export async function runESLintConfig(
  options: ESLintRunnerOptions = {},
): Promise<ESLintConfigResult> {
  const { configPath = 'eslint.config.js' } = options
  const fullConfigPath = path.resolve(process.cwd(), configPath)

  // 設定ファイルが存在するか確認
  if (!existsSync(fullConfigPath)) {
    throw new Error(`ESLint config file not found: ${fullConfigPath}`)
  }

  try {
    // bundle-requireでESLint設定を読み込む
    const bundleResult = await bundleRequire({
      filepath: fullConfigPath,
    })

    // valibot でバリデーション
    const parseResult = safeParse(bundleResultSchema, bundleResult)
    if (!parseResult.success) {
      throw new Error(`Invalid bundle result format: ${parseResult.issues[0]?.message}`)
    }

    const validatedResult = parseResult.output

    // デフォルトエクスポートを取得
    const config =
      validatedResult.default || (validatedResult.mod ? validatedResult.mod['default'] : undefined)

    if (!config) {
      throw new Error('No default export found in ESLint config')
    }

    try {
      // ルールとメタデータを抽出
      const { rules, rulesMeta, pluginsMetadata } = extractRulesAndMeta(config)

      return {
        raw: safeStringify(config), // 循環参照に対応した文字列化
        rules,
        rulesMeta,
        pluginsMetadata,
      }
    } catch (extractError) {
      logger.error(
        `Failed to extract rules from ESLint config: ${extractError instanceof Error ? extractError.message : String(extractError)}`,
      )

      // 抽出に失敗した場合は空のルールセットを返す
      return {
        raw: safeStringify(config),
        rules: {},
        rulesMeta: {},
        pluginsMetadata: {},
      }
    }
  } catch (error) {
    logger.error(
      `Failed to load ESLint config: ${error instanceof Error ? error.message : String(error)}`,
    )
    throw error
  }
}

/**
 * オブジェクトからルールを抽出する補助関数
 */
function extractRulesFromObject(
  item: Record<string, unknown>,
  rules: Record<string, unknown>,
): void {
  if ('rules' in item && item['rules'] && typeof item['rules'] === 'object') {
    Object.assign(rules, item['rules'])
  }
}

/**
 * オブジェクトからプラグイン情報を抽出する補助関数
 */
function extractPluginsFromObject(
  item: Record<string, unknown>,
  rulesMeta: Record<string, ESLintRuleMeta>,
): void {
  if ('plugins' in item && item['plugins'] && typeof item['plugins'] === 'object') {
    extractPluginMetadata(item['plugins'] as Record<string, unknown>, rulesMeta, 0)
  }
}

/**
 * 配列形式の設定からルールやプラグインを処理する
 */
function processArrayConfig(
  configArray: unknown[],
  rules: Record<string, unknown>,
  rulesMeta: Record<string, ESLintRuleMeta>,
  pluginsMetadata: Record<string, { name: string; description?: string }>,
): void {
  for (const item of configArray) {
    if (item && typeof item === 'object') {
      const configItem = item as Record<string, unknown>
      processConfigItem(configItem, rules, rulesMeta, pluginsMetadata)
    }
  }
}

/**
 * 単一の設定オブジェクトを処理する
 */
function processConfigItem(
  configItem: Record<string, unknown>,
  rules: Record<string, unknown>,
  rulesMeta: Record<string, ESLintRuleMeta>,
  pluginsMetadata: Record<string, { name: string; description?: string }>,
): void {
  // プラグイン名と説明を抽出
  if (
    'plugins' in configItem &&
    configItem['plugins'] &&
    typeof configItem['plugins'] === 'object'
  ) {
    extractPluginsMetadata(configItem['plugins'] as Record<string, unknown>, pluginsMetadata)
  }

  // ルールとプラグインを処理
  extractRulesFromObject(configItem, rules)
  extractPluginsFromObject(configItem, rulesMeta)
}

/**
 * 設定からルールとメタデータを抽出する
 */
export function extractRulesAndMeta(config: unknown): {
  rules: Record<string, unknown>
  rulesMeta: Record<string, ESLintRuleMeta>
  pluginsMetadata: Record<string, { name: string; description?: string }>
} {
  const rules: Record<string, unknown> = {}
  const rulesMeta: Record<string, ESLintRuleMeta> = {}
  // カテゴリ（プラグイン）のメタデータを格納
  const pluginsMetadata: Record<string, { name: string; description?: string }> = {
    // デフォルトのESLint Coreのカテゴリ説明
    'ESLint Core': {
      name: 'ESLint Core',
      description: 'Core ESLint rules that apply to JavaScript code.',
    },
  }

  // デバッグ出力（開発時のみ）
  logger.debug(`Extracting rules and metadata from ESLint config: ${typeof config}`)

  // 配列形式の設定を処理
  if (Array.isArray(config)) {
    processArrayConfig(config, rules, rulesMeta, pluginsMetadata)
  } else if (config && typeof config === 'object') {
    // オブジェクト形式の設定を処理
    processConfigItem(config as Record<string, unknown>, rules, rulesMeta, pluginsMetadata)
  }

  // デバッグ：見つかったプラグインメタデータを出力
  logger.debug(`Found plugin metadata: ${JSON.stringify(pluginsMetadata, null, 2)}`)

  return { rules, rulesMeta, pluginsMetadata }
}

/**
 * プラグインの説明をオブジェクトから抽出
 */
function extractPluginDescription(pluginObj: Record<string, unknown>): string | undefined {
  // 最初に meta?.description を試す
  if ('meta' in pluginObj && pluginObj['meta'] && typeof pluginObj['meta'] === 'object') {
    const meta = pluginObj['meta'] as Record<string, unknown>
    if ('description' in meta && typeof meta['description'] === 'string') {
      return meta['description']
    }
  }

  return undefined
}

/**
 * プラグイン名に基づくフォールバック説明を提供
 */
function getFallbackDescription(pluginName: string): string {
  // よく使われるESLintプラグインの説明
  const knownDescriptions: { [key: string]: string } = {
    '@typescript-eslint':
      'Rules in this category enforce TypeScript-specific best practices and type safety.',
    'unused-imports': 'Rules that prevent unused imports and variables from cluttering your code.',
    vitest: 'Rules that ensure effective testing practices when using Vitest.',
  }

  // 既知のプラグインの説明があればそれを返す、そうでなければ汎用的な説明を生成
  return knownDescriptions[pluginName] || `Rules provided from the ${pluginName} plugin.`
}

/**
 * 単一プラグインのメタデータを抽出する
 */
function extractSinglePluginMetadata(
  pluginName: string,
  plugin: unknown,
  pluginsMetadata: Record<string, { name: string; description?: string }>,
): void {
  if (!plugin || typeof plugin !== 'object') {
    return
  }

  const pluginObj = plugin as Record<string, unknown>

  // 初期メタデータを設定
  pluginsMetadata[pluginName] = {
    name: pluginName,
  }

  // 説明を取得する順序:
  // 1. プラグインオブジェクトから直接抽出
  // 2. フォールバック説明を使用
  const extractedDescription = extractPluginDescription(pluginObj)

  // プラグインから説明が取得できる場合はそれを使用、そうでなければフォールバック
  pluginsMetadata[pluginName].description =
    extractedDescription || getFallbackDescription(pluginName)
}

/**
 * プラグインのメタデータを抽出する
 */
function extractPluginsMetadata(
  plugins: Record<string, unknown>,
  pluginsMetadata: Record<string, { name: string; description?: string }>,
): void {
  for (const [pluginName, plugin] of Object.entries(plugins)) {
    extractSinglePluginMetadata(pluginName, plugin, pluginsMetadata)
  }
}

/**
 * ルールのメタデータを検証して抽出する補助関数
 */
function extractRuleMetadata(
  ruleName: string,
  pluginName: string,
  ruleConfig: unknown,
  rulesMeta: Record<string, ESLintRuleMeta>,
): void {
  // valibotでルール設定の構造を検証
  const result = safeParse(eslintRuleSchema, ruleConfig)
  if (!result.success) {
    return
  }

  const { meta } = result.output
  if (!meta) {
    return
  }

  const ruleId = pluginName === '$' ? ruleName : `${pluginName}/${ruleName}`

  rulesMeta[ruleId] = {
    description: meta.docs?.description || undefined,
    url: meta.docs?.url || undefined,
    recommended: !!meta.docs?.recommended,
    type: meta.type || undefined,
  }
}

/**
 * プラグインからルールメタデータを抽出
 */
function extractPluginMetadata(
  plugins: Record<string, unknown>,
  rulesMeta: Record<string, ESLintRuleMeta>,
  depth = 0,
): void {
  // 再帰の深さを制限して無限ループを防止
  if (depth >= 3) {
    logger.warn('Plugin recursion depth exceeded, stopping further processing')
    return
  }

  for (const [pluginName, plugin] of Object.entries(plugins)) {
    if (!plugin || typeof plugin !== 'object') {
      continue
    }

    // プラグインルールを処理
    if ('rules' in plugin && plugin.rules && typeof plugin.rules === 'object') {
      processPluginRules(pluginName, plugin.rules as Record<string, unknown>, rulesMeta)
    }

    // 特別なケース: @typescript-eslint などネストされた設定を処理
    if ('configs' in plugin && plugin.configs && typeof plugin.configs === 'object') {
      processNestedConfigs(plugin.configs as Record<string, unknown>, rulesMeta, depth + 1)
    }
  }
}

/**
 * プラグインルールを処理する
 */
function processPluginRules(
  pluginName: string,
  pluginRules: Record<string, unknown>,
  rulesMeta: Record<string, ESLintRuleMeta>,
): void {
  for (const [ruleName, ruleConfig] of Object.entries(pluginRules)) {
    extractRuleMetadata(ruleName, pluginName, ruleConfig, rulesMeta)
  }
}

/**
 * ネストされた設定（configsプロパティ）からルールメタデータを抽出
 */
function processNestedConfigs(
  configs: Record<string, unknown>,
  rulesMeta: Record<string, ESLintRuleMeta>,
  depth = 0,
): void {
  for (const config of Object.values(configs)) {
    if (!config || typeof config !== 'object') {
      continue
    }

    // plugins内のルールを再帰的に処理
    if ('plugins' in config && config['plugins'] && typeof config['plugins'] === 'object') {
      extractPluginMetadata(config['plugins'] as Record<string, unknown>, rulesMeta, depth)
    }
  }
}
