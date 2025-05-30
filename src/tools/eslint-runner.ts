import { existsSync } from 'node:fs'
import path from 'node:path'
import { safeStringify } from '@/utils/safeStringify.ts'
import { bundleRequire } from 'bundle-require'
import { Result, ResultAsync, err, ok } from 'neverthrow'
import { object, optional, record, safeParse, string, unknown } from 'valibot'
import { Logger } from '../utils/logger.ts'

const logger = new Logger()

// ESLint config options
interface ESLintRunnerOptions {
  configPath?: string | undefined // Path to ESLint config file (default: eslint.config.js)
  verbose?: boolean | undefined // Enable verbose mode
}

// Type representing ESLint rule metadata
interface ESLintRuleMeta {
  description?: string | undefined // Rule description
  url?: string | undefined // Documentation URL
  recommended?: boolean | undefined // Whether it's a recommended rule
  type?: string | undefined // Rule type (e.g. "problem", "suggestion", "layout")
}

// Type definition for ESLint execution result
export interface ESLintConfigResult {
  raw: string
  rules: Record<string, unknown>
  rulesMeta: Record<string, ESLintRuleMeta>
  pluginsMetadata?: Record<string, { name: string; description?: string }>
}

// Validation schema for bundle-require results
const bundleResultSchema = object({
  mod: optional(record(string(), unknown())),
  default: optional(unknown()),
})

// Validation schema for ESLint configuration
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
 * List of supported ESLint configuration file formats in priority order
 */
const CONFIG_FILE_FORMATS = {
  // New JavaScript formats
  newJS: [
    'eslint.config.js', // Original format
    'eslint.config.mjs', // ESM format
    'eslint.config.cjs', // CommonJS format
  ],
  // TypeScript formats
  newTS: [
    'eslint.config.ts', // TypeScript format
    'eslint.config.mts', // TypeScript ESM format
    'eslint.config.cts', // TypeScript CommonJS format
  ],
  // Legacy formats
  legacy: ['.eslintrc.js', '.eslintrc.json', '.eslintrc.yaml', '.eslintrc.yml', '.eslintrc'],
}

/**
 * Generates the error message for when no ESLint config file is found
 */
function getConfigNotFoundErrorMessage(): string {
  const allFormats = [
    ...CONFIG_FILE_FORMATS.newJS,
    ...CONFIG_FILE_FORMATS.newTS,
    ...CONFIG_FILE_FORMATS.legacy,
  ].join(', ')

  return `No ESLint configuration file found. Supported formats: ${allFormats}`
}

/**
 * Gets the full path for a config file
 */
function getFullConfigPath(basePath: string, configName: string): string {
  return path.resolve(basePath, configName)
}

/**
 * Find ESLint configuration file in the project
 * Checks for both new (eslint.config.js) and legacy (.eslintrc.*) formats
 */
export function findESLintConfig(userConfigPath?: string): Result<string, Error> {
  const localLogger = new Logger()
  const basePath = process.cwd()

  // If user specified a config path, use it
  if (userConfigPath) {
    const fullPath = getFullConfigPath(basePath, userConfigPath)
    if (existsSync(fullPath)) {
      localLogger.debug(`Using user-specified ESLint config: ${fullPath}`)
      return ok(fullPath)
    }
    return err(new Error(`ESLint config file not found at specified path: ${fullPath}`))
  }

  // Check for all configuration formats in priority order

  // First check new JavaScript formats
  for (const format of CONFIG_FILE_FORMATS.newJS) {
    const configPath = getFullConfigPath(basePath, format)
    if (existsSync(configPath)) {
      localLogger.debug(`Found new JS format ESLint config: ${configPath}`)
      return ok(configPath)
    }
  }

  // Then check TypeScript config formats
  for (const format of CONFIG_FILE_FORMATS.newTS) {
    const configPath = getFullConfigPath(basePath, format)
    if (existsSync(configPath)) {
      localLogger.debug(`Found new TS format ESLint config: ${configPath}`)
      return ok(configPath)
    }
  }

  // Finally check legacy formats
  for (const format of CONFIG_FILE_FORMATS.legacy) {
    const configPath = getFullConfigPath(basePath, format)
    if (existsSync(configPath)) {
      localLogger.debug(`Found legacy format ESLint config: ${configPath}`)
      return ok(configPath)
    }
  }

  // No config found
  return err(new Error(getConfigNotFoundErrorMessage()))
}

/**
 * Load and parse the ESLint config using bundle-require
 */
function loadESLintConfig(configPath: string, logger: Logger): ResultAsync<unknown, Error> {
  return ResultAsync.fromPromise(
    bundleRequire({
      filepath: configPath,
    }),
    (error) =>
      new Error(
        `Failed to bundle ESLint config: ${error instanceof Error ? error.message : String(error)}`,
      ),
  ).andThen((bundleResult) => {
    logger.dump('ESLint bundle-require result', bundleResult)

    const parseResult = safeParse(bundleResultSchema, bundleResult)
    if (!parseResult.success) {
      return err(new Error(`Invalid bundle result format: ${parseResult.issues[0]?.message}`))
    }

    const validatedResult = parseResult.output

    const config =
      validatedResult.default || (validatedResult.mod ? validatedResult.mod['default'] : undefined)

    if (!config) {
      return err(new Error('No default export found in ESLint config'))
    }

    return ok(config)
  })
}

/**
 * Create ESLint result object from config
 */
function createESLintResult(
  config: unknown,
  rules: Record<string, unknown>,
  rulesMeta: Record<string, ESLintRuleMeta>,
  pluginsMetadata: Record<string, { name: string; description?: string }>,
): Result<ESLintConfigResult, Error> {
  const stringifyResult = safeStringify(config)
  if (!stringifyResult.isOk()) {
    return err(stringifyResult.error)
  }

  return ok({
    raw: stringifyResult.value,
    rules,
    rulesMeta,
    pluginsMetadata,
  })
}

/**
 * Create empty ESLint result with only raw config
 */
function createEmptyESLintResult(config: unknown): Result<ESLintConfigResult, Error> {
  const stringifyResult = safeStringify(config)
  if (!stringifyResult.isOk()) {
    return err(stringifyResult.error)
  }

  return ok({
    raw: stringifyResult.value,
    rules: {},
    rulesMeta: {},
    pluginsMetadata: {},
  })
}

/**
 * Load ESLint configuration using bundle-require
 */
export function runESLintConfig(
  options: ESLintRunnerOptions = {},
): ResultAsync<ESLintConfigResult, Error> {
  const { configPath, verbose } = options
  const logger = new Logger({ verbose: verbose ?? undefined })

  // Find the config file
  return findESLintConfig(configPath)
    .asyncAndThen((fullConfigPath) => {
      logger.info(`Using ESLint config file: ${fullConfigPath}`)

      // Load and parse the ESLint config
      return loadESLintConfig(fullConfigPath, logger)
    })
    .andThen((config) => {
      // Extract rules and metadata from the config
      return extractRulesAndMeta(config)
        .andThen(({ rules, rulesMeta, pluginsMetadata }) =>
          createESLintResult(config, rules, rulesMeta, pluginsMetadata),
        )
        .orElse((extractError) => {
          logger.error(`Failed to extract rules from ESLint config: ${extractError.message}`)
          return createEmptyESLintResult(config)
        })
    })
}

/**
 * Helper function to extract rules from an object
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
 * Helper function to extract plugin information from an object
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
 * Process rules and plugins from array-format configuration
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
 * Process a single configuration object
 */
function processConfigItem(
  configItem: Record<string, unknown>,
  rules: Record<string, unknown>,
  rulesMeta: Record<string, ESLintRuleMeta>,
  pluginsMetadata: Record<string, { name: string; description?: string }>,
): void {
  if (
    'plugins' in configItem &&
    configItem['plugins'] &&
    typeof configItem['plugins'] === 'object'
  ) {
    extractPluginsMetadata(configItem['plugins'] as Record<string, unknown>, pluginsMetadata)
  }
  extractRulesFromObject(configItem, rules)
  extractPluginsFromObject(configItem, rulesMeta)
}

type ExtractRulesAndMetaResult = {
  rules: Record<string, unknown>
  rulesMeta: Record<string, ESLintRuleMeta>
  pluginsMetadata: Record<string, { name: string; description?: string }>
}

/**
 * Extract rules and metadata from configuration
 * Returns a Result with the extracted rules and metadata or an Error
 */
export function extractRulesAndMeta(config: unknown): Result<ExtractRulesAndMetaResult, Error> {
  const extractRules = Result.fromThrowable(
    (inputConfig: unknown) => {
      const rules: Record<string, unknown> = {}
      const rulesMeta: Record<string, ESLintRuleMeta> = {}
      // Store metadata for categories (plugins)
      const pluginsMetadata: Record<string, { name: string; description?: string }> = {
        // Default category description for ESLint Core
        'ESLint Core': {
          name: 'ESLint Core',
          description: 'Core ESLint rules that apply to JavaScript code.',
        },
      }

      // Process array-format configuration
      if (Array.isArray(inputConfig)) {
        processArrayConfig(inputConfig, rules, rulesMeta, pluginsMetadata)
      } else if (inputConfig && typeof inputConfig === 'object') {
        // Process object-format configuration
        processConfigItem(inputConfig as Record<string, unknown>, rules, rulesMeta, pluginsMetadata)
      }

      return { rules, rulesMeta, pluginsMetadata }
    },
    (error) =>
      error instanceof Error ? error : new Error(`Failed to extract rules: ${String(error)}`),
  )

  return extractRules(config)
}

/**
 * Extract plugin description from an object
 */
function extractPluginDescription(pluginObj: Record<string, unknown>): string | undefined {
  // First try meta?.description
  if ('meta' in pluginObj && pluginObj['meta'] && typeof pluginObj['meta'] === 'object') {
    const meta = pluginObj['meta'] as Record<string, unknown>
    if ('description' in meta && typeof meta['description'] === 'string') {
      return meta['description']
    }
  }

  return undefined
}

/**
 * Provide fallback description based on plugin name
 */
function getFallbackDescription(pluginName: string): string {
  // Descriptions for commonly used ESLint plugins
  const knownDescriptions: { [key: string]: string } = {
    '@typescript-eslint':
      'Rules in this category enforce TypeScript-specific best practices and type safety.',
    'unused-imports': 'Rules that prevent unused imports and variables from cluttering your code.',
    vitest: 'Rules that ensure effective testing practices when using Vitest.',
  }

  // Return known description if available, otherwise generate a generic one
  return knownDescriptions[pluginName] || `Rules provided from the ${pluginName} plugin.`
}

/**
 * Extract metadata for a single plugin
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

  // Set initial metadata
  pluginsMetadata[pluginName] = {
    name: pluginName,
  }

  // Order of getting description:
  // 1. Extract directly from plugin object
  // 2. Use fallback description
  const extractedDescription = extractPluginDescription(pluginObj)

  // Use description from plugin if available, otherwise use fallback
  pluginsMetadata[pluginName].description =
    extractedDescription || getFallbackDescription(pluginName)
}

/**
 * Extract metadata from plugins
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
 * Helper function to validate and extract rule metadata
 */
function extractRuleMetadata(
  ruleName: string,
  pluginName: string,
  ruleConfig: unknown,
  rulesMeta: Record<string, ESLintRuleMeta>,
): void {
  // Validate rule configuration structure with valibot
  const result = safeParse(eslintRuleSchema, ruleConfig)
  if (!result.success) {
    return
  }

  const { meta } = result.output
  if (!meta) {
    return
  }

  const ruleId = pluginName === 'ESLint Core' ? ruleName : `${pluginName}/${ruleName}`

  rulesMeta[ruleId] = {
    description: meta.docs?.description || undefined,
    url: meta.docs?.url || undefined,
    recommended: !!meta.docs?.recommended,
    type: meta.type || undefined,
  }
}

/**
 * Extract rule metadata from plugins
 */
function extractPluginMetadata(
  plugins: Record<string, unknown>,
  rulesMeta: Record<string, ESLintRuleMeta>,
  depth = 0,
): void {
  // Limit recursion depth to prevent infinite loops
  if (depth >= 3) {
    logger.debug('Plugin recursion depth exceeded, stopping further processing')
    return
  }

  for (const [pluginName, plugin] of Object.entries(plugins)) {
    if (!plugin || typeof plugin !== 'object') {
      continue
    }

    // Process plugin rules
    if ('rules' in plugin && plugin.rules && typeof plugin.rules === 'object') {
      processPluginRules(pluginName, plugin.rules as Record<string, unknown>, rulesMeta)
    }

    // Special case: process nested configs like @typescript-eslint
    if ('configs' in plugin && plugin.configs && typeof plugin.configs === 'object') {
      processNestedConfigs(plugin.configs as Record<string, unknown>, rulesMeta, depth + 1)
    }
  }
}

/**
 * Process plugin rules
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
 * Extract rule metadata from nested configs (configs property)
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

    // Recursively process rules in plugins
    if ('plugins' in config && config['plugins'] && typeof config['plugins'] === 'object') {
      extractPluginMetadata(config['plugins'] as Record<string, unknown>, rulesMeta, depth)
    }
  }
}
