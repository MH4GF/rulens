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
  - `--eslint-args "<args>"`：`eslint --print-config` にそのまま渡す追加オプション
  - `--output <file.md>`（デフォルト `docs/lint-rules.md`）

- **バイナリ解決ロジック**

  1. プロジェクトの `node_modules/.bin/biome`／`.bin/eslint` を最優先で探して実行
  2. 見つからなければグローバルコマンドにフォールバック

- **出力フォーマット**

  - 各ルールセットをセクション分けして Markdown 整形
  - セクション内に実行コマンド例（コードブロック）と結果 JSON コードブロックを併記
  - 各ルールに説明文を追加して表示

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

### 5.4 共通中間表現の設計

- **中間表現の型定義**

  ```typescript
  // src/types/rulens.ts
  
  /**
   * 個別のルール情報を表す型
   */
  export interface RulensRule {
    id: string // 完全なルールID (例: "suspicious/noCatchAssign")
    name: string // ルール名のみ (例: "noCatchAssign")
    description: string // 説明文
    url?: string // ドキュメントURL (任意)
  }
  
  /**
   * カテゴリー内のルール集合を表す型
   */
  export interface RulensCategory {
    name: string // カテゴリー名 (例: "suspicious")
    description?: string // カテゴリーの説明 (任意)
    rules: RulensRule[] // このカテゴリーに属するルール
  }
  
  /**
   * Lintツール全体の設定を表す型
   */
  export interface RulensLinter {
    name: string // Linterの名前 (例: "Biome", "ESLint")
    categories: RulensCategory[] // カテゴリーのリスト
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

  3. **拡張性**: 新しいLintツールに対応する場合、固有のパーサーを実装するだけで、マークダウン生成部分は共通利用

#### Markdown フォーマット例

```markdown
# Rulens Lint Rules Dump

## Biome rules

## ESLint rules
```

## 2. ESLint 設定

```bash
eslint --print-config src/index.js --color
```

```json
{
  /* --print-config 結果の JSON */
}
```

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
│ └── crawl-biome-rules.ts # Biomeルール説明クローリングスクリプト
├── src/
│ ├── index.ts # CLI エントリポイント（commander.js 初期化）
│ ├── index.test.ts # テストファイル（隣置き）
│ ├── commands/
│ │ ├── generate.ts # generate コマンド定義
│ │ └── generate.test.ts
│ ├── tools/
│ │ ├── biome-runner.ts # Biome 実行ロジック
│ │ ├── biome-runner.test.ts
│ │ ├── eslint-runner.ts # ESLint 実行ロジック
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
│ │ └── rulens.ts # 共通中間表現の型定義
│ ├── data/
│ │ └── biome-rules.json # クローリングした Biome ルール説明データ
│ └── utils/
│ ├── bin-resolver.ts # バイナリ解決ユーティリティ
│ ├── bin-resolver.test.ts
│ ├── executor.ts # execa ラッパー
│ ├── executor.test.ts
│ ├── logger.ts # ロギングユーティリティ
│ └── logger.test.ts
└── dist/ # tsup ビルド成果物
```

```
