# 要件定義：Lint 設定マークダウン出力 CLI (`rulens`)

## 1. 目的

- プロジェクトで使われている Biome／ESLint の現在設定を Markdown 形式で出力し、AI コーディングエージェントへの入力やドキュメント化を自動化する。

## 2. 背景

- CI／CD パイプラインに設定ダンプ機能がない
- 設定変更時に手動でドキュメントを更新するのは手間・漏れのリスクが高い
- AI に最新ルールを正確に与えることで一貫したコード品質を担保したい

## 3. 対象ユーザー

- 開発チーム（エンジニア、リード、QA）
- AI コーディングエージェント導入チーム

## 4. 範囲

- CLI 実行環境：Node.js ≥20
- 初期サポート：Biome, ESLint
- 将来的拡張：Prettier, Stylelint 等へのプラグイン対応

## 5. 機能要件

### 5.1 コマンド設計

| コマンド          | 概要                                             |
| ----------------- | ------------------------------------------------ |
| `rulens generate` | カレントディレクトリの設定を解析し Markdown 出力 |

### 5.2 入出力仕様

- **入力オプション**

  - `--biome-args "<args>"`：`biome rage` にそのまま渡す追加オプション
  - `--eslint-config <path>`：ESLint 設定ファイルのパス（デフォルト：`eslint.config.js`）
  - `--output <file.md>`（デフォルト `docs/lint-rules.md`）

- **バイナリ解決ロジック**（Biome のみ適用）

  1. プロジェクトの `node_modules/.bin/biome` を最優先で探して実行
  2. 見つからなければグローバルコマンドにフォールバック

- **改善された出力フォーマット**

  - リッチなドキュメントヘッダー：「Project Lint Rules Reference」として明確なタイトル
  - ドキュメント概要：自動生成元と目的の説明
  - 詳細な目次：セクションへのリンク付き
  - AI向け使用ガイダンス：AIコーディングアシスタント向けの具体的なルール適用ガイド
  - カテゴリー説明：各カテゴリーの目的と重要性の説明
  - 表形式での整理：表組みによる整理された視覚的なルール表示（ルール名、説明、重要度）
  - セクション区切り：Markdownの区切り線による明確なセクション分け
  - 絵文字による視覚的補助：各セクションタイトルに適切な絵文字を追加

### 5.3 Biome ルール説明のクローリング

- **クローリング機能**

  - Biome 公式ドキュメント（https://biomejs.dev/linter/rules/）から各ルールの説明文を取得
  - 各ルールの簡潔な説明文のみを抽出（詳細な使用例は含まない）
  - クローリング結果は静的な JSON ファイルとしてリポジトリに保存
  - 開発時ツールとして使用し、生成した JSON ファイルをコード内でインポートして使用

- **ルール説明のデータ構造**

  ```typescript
  // src/data/biome-rules.json の形式
  interface BiomeRuleDescription {
    // キー: "カテゴリー/ルール名" (例: "suspicious/noCatchAssign")
    [ruleId: string]: {
      description: string; // ルールの説明文
      url?: string; // ドキュメントURL
    };
  }
  ```

- **ルール説明の表示形式**

  ```markdown
  ### カテゴリー名

  - `ルール名`: 説明文
  ```

  例:

  ```markdown
  ### suspicious

  - `noCatchAssign`: Disallows reassigning exceptions in catch clauses.
  - `noDebugger`: Disallows using the debugger statement.
  ```

### 5.4 ESLint ルール説明の取得

- **bundle-require を使用した設定読み込み**

  - `eslint --print-config` コマンド実行ではなく、bundle-require を使用して設定ファイルを読み込む
  - ESLint 設定ファイル（eslint.config.js）を動的にロードし、ルール設定とメタデータを抽出
  - 外部プロセス起動が不要になり、より高速かつ安定した実行が可能

- **ESLint ルール情報の取得ロジック**

  ```typescript
  // ESLintRunnerの主要部分
  export async function runESLintConfig(
    options: ESLintRunnerOptions = {}
  ): Promise<ESLintConfigResult> {
    const { configPath = "eslint.config.js" } = options;
    const fullConfigPath = resolve(process.cwd(), configPath);

    // bundle-requireでESLint設定を読み込む
    const result = await bundleRequire({
      filepath: fullConfigPath,
    });

    // デフォルトエクスポートを取得
    const config = result.default || result.mod?.default;

    // ルールとメタデータを抽出
    const { rules, rulesMeta } = extractRulesAndMeta(config);

    return {
      raw: JSON.stringify(config, null, 2),
      rules,
      rulesMeta,
    };
  }
  ```

- **ルールメタデータの抽出**

  - 設定ファイルからプラグインルールを含むすべてのルールの説明と URL を抽出
  - ESLint ルールの説明、URL、タイプ（problem/suggestion/layout）などの詳細情報を取得
  - メタデータ抽出例：

  ```typescript
  // メタデータ抽出の例
  if (typeof ruleConfig === "object" && "meta" in ruleConfig) {
    const meta = ruleConfig.meta;
    if (meta.docs) {
      rulesMeta[ruleId] = {
        description: meta.docs.description,
        url: meta.docs.url,
        recommended: !!meta.docs.recommended,
        type: meta.type,
      };
    }
  }
  ```

- **拡張された ESLint 設定結果型**

  ```typescript
  // 拡張されたESLint設定結果型
  export interface ESLintConfigResult {
    raw: string;
    rules: Record<string, unknown>;
    rulesMeta: Record<string, ESLintRuleMeta>;
  }

  export interface ESLintRuleMeta {
    description?: string; // ルールの説明
    url?: string; // ドキュメントURL
    recommended?: boolean; // 推奨ルールかどうか
    type?: string; // ルールの種類（problem/suggestion/layout）
  }
  ```

### 5.5 共通中間表現の設計

- **中間表現の型定義**

  ```typescript
  // src/types/rulens.ts

  /**
   * 個別のルール情報を表す型
   */
  export interface RulensRule {
    id: string; // 完全なルールID (例: "suspicious/noCatchAssign")
    name: string; // ルール名のみ (例: "noCatchAssign")
    description: string; // 説明文
    url?: string; // ドキュメントURL (任意)
    severity?: string; // ルールの重要度 (任意、"error"/"warn"/"off"など)
    options?: unknown; // ルール固有のオプション設定 (任意)
  }

  /**
   * カテゴリー内のルール集合を表す型
   */
  export interface RulensCategory {
    name: string; // カテゴリー名 (例: "suspicious")
    description?: string; // カテゴリーの説明 (任意)
    rules: RulensRule[]; // このカテゴリーに属するルール
  }

  /**
   * Lintツール全体の設定を表す型
   */
  export interface RulensLinter {
    name: string; // Linterの名前 (例: "Biome", "ESLint")
    categories: RulensCategory[]; // カテゴリーのリスト
  }
  ```

- **アーキテクチャ設計**

  1. **パーサー**: 各ツール固有の出力を共通の中間表現に変換

     ```
     BiomeRageResult/ESLintConfigResult → RulensLinter
     ```

  2. **マークダウンジェネレーター**: 中間表現から統一された形式のマークダウンを生成

     ```
     RulensLinter → Markdown
     ```

  3. **拡張性**: 新しい Lint ツールに対応する場合、固有のパーサーを実装するだけで、マークダウン生成部分は共通利用

#### Markdown フォーマット例

```markdown
# Project Lint Rules Reference

## 📋 Document Overview

This document contains a comprehensive catalog of linting rules enabled in this project. It is automatically generated by [Rulens](https://github.com/MH4GF/rulens) and provides AI code assistants and developers with detailed information about code style and quality requirements.

---

## 📑 Table of Contents

- [Introduction](#introduction)
- [AI Usage Guide](#ai-usage-guide)
- [Biome Rules](#biome-rules)
  - [Accessibility](#accessibility)
  - [Style](#style)
- [ESLint Rules](#eslint-rules)
  - [@typescript-eslint](#typescript-eslint)
  - [ESLint Core](#eslint-core)

---

## 📖 Introduction

This document lists all active linting rules configured in the project. Each rule includes:

- A link to official documentation
- A brief description of what the rule enforces
- Severity level (when available)

---

## 🤖 AI Usage Guide

**For AI Code Assistants**: When generating code for this project, please adhere to the following guidelines:

1. **Scan relevant categories first**: Focus on rules in categories related to the code you're generating.
2. **Respect all rules**: Ensure all generated code follows all linting rules.
3. **Avoid common pitfalls**: Check complexity rules to avoid anti-patterns.

---

## 🔧 Biome Rules

Biome enforces modern JavaScript/TypeScript best practices with a focus on correctness, maintainability, and performance.

### Accessibility

Rules in this category ensure that code is accessible to all users, including those using assistive technologies.

| Rule                                                                                      | Description                                                                                                        |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [`noAccessKey`](https://biomejs.dev/linter/rules/no-access-key)                           | Enforce that the accessKey attribute is not used on any HTML element.                                              |
| [`useAltText`](https://biomejs.dev/linter/rules/use-alt-text)                             | Enforce that all elements that require alternative text have meaningful information to relay back to the end user. |

### Style

Rules in this category enforce consistent code style and patterns.

| Rule                                                           | Description                                                           |
| -------------------------------------------------------------- | --------------------------------------------------------------------- |
| [`noVar`](https://biomejs.dev/linter/rules/no-var)             | Disallow the use of var                                               |
| [`useConst`](https://biomejs.dev/linter/rules/use-const)       | Require const declarations for variables that are only assigned once. |

---

## 🔧 ESLint Rules

ESLint provides static analysis focused on identifying potential errors and enforcing coding standards.

### @typescript-eslint

Rules in this category enforce TypeScript-specific best practices and type safety.

| Rule                                                                    | Description                                     |
| ----------------------------------------------------------------------- | ----------------------------------------------- |
| [`no-explicit-any`](https://typescript-eslint.io/rules/no-explicit-any) | Disallow the `any` type                         |
| [`no-unused-vars`](https://typescript-eslint.io/rules/no-unused-vars)   | Disallow variables that are declared but unused |
```

## 6. 非機能要件

- 実行速度：1 ツールあたり 1 秒以内
- エラーハンドリング：設定ファイル未検出時は明確なメッセージと非ゼロ終了コード
- ロギング：`--verbose` で詳細ログ出力
- テストカバレッジ：ユニットテスト 80%以上

## 7. 拡張性

- プラグイン機構：`plugins/` フォルダにツール別モジュールを配置
- 新規ツール対応：`ToolInterface`（TypeScript）を実装すれば即追加可

## 8. 開発／運用

- 言語：TypeScript
- ビルド：tsup
- テスト：Vitest
- 配布：npm パッケージ（`npx rulens generate` で実行可能）
- CI：GitHub Actions にてビルド／テスト／npm 連携

## 9. ドキュメント

- README にインストール方法・CLI リファレンス記載
- CHANGELOG.md でバージョン追跡

## 10. ディレクトリ構成

```
rulens/
├── package.json
├── tsconfig.json
├── tsup.config.ts # tsup 設定ファイル
├── .gitignore
├── README.md
├── scripts/
│ ├── crawl-biome-rules.ts # Biomeルール説明クローリングスクリプト
│ └── read-eslint-config.ts # ESLint設定読み込みスクリプト (開発用PoC)
├── src/
│ ├── index.ts # CLI エントリポイント（commander.js 初期化）
│ ├── index.test.ts # テストファイル（隣置き）
│ ├── commands/
│ │ ├── generate.ts # generate コマンド定義
│ │ └── generate.test.ts
│ ├── tools/
│ │ ├── biome-runner.ts # Biome 実行ロジック
│ │ ├── biome-runner.test.ts
│ │ ├── eslint-runner.ts # ESLint 設定読み込みロジック (bundle-require使用)
│ │ └── eslint-runner.test.ts
│ ├── parsers/
│ │ ├── biome-parser.ts # Biome結果を中間表現に変換
│ │ ├── biome-parser.test.ts
│ │ ├── eslint-parser.ts # ESLint結果を中間表現に変換
│ │ └── eslint-parser.test.ts
│ ├── markdown/
│ │ ├── generator.ts # Markdown 生成ロジック
│ │ ├── generator.test.ts
│ │ ├── lint-to-markdown.ts # 中間表現からマークダウン生成
│ │ └── lint-to-markdown.test.ts
│ ├── types/
│ │ ├── rulens.ts # 共通中間表現の型定義
│ │ └── eslint-rules.ts # ESLint ルールメタデータ型定義
│ ├── data/
│ │ └── biome-rules.json # クローリングした Biome ルール説明データ
│ └── utils/
│   ├── bin-resolver.ts # バイナリ解決ユーティリティ
│   ├── bin-resolver.test.ts
│   ├── executor.ts # execa ラッパー
│   ├── executor.test.ts
│   ├── logger.ts # ロギングユーティリティ
│   └── logger.test.ts
└── dist/ # tsup ビルド成果物
```
