# rulens 実装タスクリスト

## プロジェクト基盤構築

### プロジェクト初期化
- [x] package.json基本設定（名前、バージョン、ライセンス、Node.js 20+エンジン要件）
- [x] package.jsonスクリプト設定（build, dev, test, lint, format, typecheck）
- [x] 開発依存関係インストール
  - [x] typescript, tsup, vitest
  - [x] @mh4gf/configs, @mh4gf/eslint-config
  - [x] @biomejs/biome
  - [x] syncpack
  - [x] eslint, @mh4gf/eslint-config
  - [x] knip
- [x] プロジェクト依存関係インストール
  - [x] commander: CLIコマンド設計
  - [x] execa: 外部コマンド実行
  - [x] picocolors: ターミナル出力のカラー
  - [x] valibot: バリデーション
- [x] CLI設定（bin指定など）

### TypeScript設定
- [x] @mh4gf/configsのインストール
- [x] tsconfig.jsonの作成とベース設定の継承
- [x] プロジェクト固有のtsconfig設定（パス、出力先等）

### リンター・フォーマッター設定
- [x] Biome設定
  - [x] biome.jsonの作成と@mh4gf/configsの設定の継承
  - [x] プロジェクト固有のBiome設定
- [x] ESLint設定
  - [x] @mh4gf/eslint-configのインストール
  - [x] .eslintrc.js/.eslintrc.jsonの作成と設定の継承
  - [x] プロジェクト固有のESLint設定
- [x] Knip設定
  - [x] knipの設定と使用方法のドキュメント化（CLAUDE.md）
  - [x] unused exportsなどの修正手順確立

### ビルド・テスト環境設定
- [x] tsup設定
  - [x] tsup.config.tsファイルの作成
  - [x] エントリーポイントとビルド設定
  - [x] バンドルとデクラレーションファイルの設定
- [x] Vitestテスト環境
  - [x] vitest.config.tsの作成
  - [x] テストディレクトリ構造とサンプルテストの作成
  - [x] カバレッジ設定（80%以上）

### ディレクトリ構造整備
- [x] src/ディレクトリと基本ファイル構造作成
- [x] サブディレクトリ作成（commands/, tools/, markdown/, utils/）
- [x] 新規ディレクトリ作成
  - [x] src/data/ ディレクトリの作成（ルール説明JSONデータ用）
  - [x] src/types/ ディレクトリの作成（共通型定義用）
  - [x] src/parsers/ ディレクトリの作成（各linter用パーサー）
  - [x] ルートに scripts/ ディレクトリの作成（開発用スクリプト用）
- [ ] README.mdの初期版作成

## コア機能実装

- [x] CLI基盤実装（commander.js）
- [x] バイナリ解決ロジック実装（ローカル/グローバル）
- [x] ユーティリティ（logger, executor）実装

## Biome対応（優先実装）

- [x] Biome実行ロジック実装
- [x] Biome出力結果のパース・整形
- [x] Biome設定をMarkdown形式に変換
- [x] Biomeルール説明のクローリング機能実装
  - [x] `scripts/`ディレクトリの作成（開発用スクリプト用）
  - [x] クローラースクリプトの作成（`scripts/crawl-biome-rules.ts`）
  - [x] Node.js fetch + HTMLパーサーによるクローリング実装
  - [x] ルールID（カテゴリー/ルール名）からURLへの変換ロジック実装
  - [x] 公式サイトからルール説明の抽出ロジック実装
  - [x] 抽出データを`src/data/biome-rules.json`として保存する機能実装
  - [x] package.jsonにスクリプト追加（`"crawl": "tsx scripts/crawl-biome-rules.ts"`）
  - [x] マークダウン出力時にルール説明を統合する機能実装

## ESLint対応

- [x] ESLint実行ロジック実装
- [x] ESLint出力結果のパース・整形
- [x] ESLint設定をMarkdown形式に変換
- [x] ESLint実行時の無限再帰問題の修正（スタックオーバーフロー対策）
- [x] ESLint設定のバリデーションとより厳密な型付けの実装

## Markdown生成

- [x] Markdown生成エンジン実装
- [x] Biomeルール出力テンプレート作成
- [x] ESLintルール出力テンプレート作成
- [x] ファイル出力機能実装
- [x] 共通中間表現を使ったマークダウン生成機能への改修
  - [x] 共通の型定義ファイル作成（`src/types/rulens.ts`）
  - [x] Biome用パーサーの実装（`src/parsers/biome-parser.ts`）
  - [x] ESLint用パーサーの実装（`src/parsers/eslint-parser.ts`）
  - [x] 中間表現からマークダウンを生成する共通関数の実装（`src/markdown/lint-to-markdown.ts`）
  - [x] メインジェネレーターの更新（パーサーと中間表現を使用）
  - [x] 各ツール固有の実装とのインターフェース調整
- [x] ルール説明を含むマークダウン形式への拡張
  - [x] Biomeルール説明のJSONデータをパーサーで活用
  - [x] マークダウン出力にルール説明と URL を含める
  - [x] テストの更新

## エラーハンドリング改善

- [x] Lintツール検出の改善
  - [x] Biome/ESLint各ツールの存在を個別に検出するロジック実装
  - [x] 見つかったツールのみを実行するように変更
  - [x] 全ツールがなかった場合のみエラー表示
- [x] ESLint設定ファイル解決の改善
  - [x] 設定ファイル検索ロジック実装
  - [x] 複数の設定ファイル形式サポート（`eslint.config.js` と `.eslintrc.*` など）
  - [x] 設定ファイルがない場合のエラーハンドリング改善
  - [ ] 追加のESLint設定ファイル形式サポート拡張
    - [ ] 設定ファイル検索ロジック更新（追加のファイル形式）
      - [ ] JavaScript形式サポート: `eslint.config.js`, `eslint.config.mjs`, `eslint.config.cjs`
      - [ ] TypeScript形式サポート: `eslint.config.ts`, `eslint.config.mts`, `eslint.config.cts`
    - [ ] 優先順位ロジックの確認と整理
    - [ ] ユニットテストの追加と実装確認
    - [ ] エラーメッセージの更新
- [x] 出力ディレクトリ関連
  - [x] 出力ディレクトリがない場合は自動作成するロジック実装
  - [x] 出力先ディレクトリの親ディレクトリ存在確認ロジック実装

## 出力フォーマットの最適化

- [x] severityがoffのルールは出力しない機能実装
  - [x] eslint-parser.tsにフィルタリング機能を追加
  - [x] テストケースの追加
- [x] ESLintのマークダウン出力からseverityを削除
  - [x] ESLint特有のseverity表示を削除
  - [x] カテゴリ表示の最適化
- [ ] 出力されるMarkdownの改善
  - [ ] TOCの自動生成機能強化
  - [ ] カテゴリ説明の拡充（ESLint）
  - [ ] ドキュメント全体の読みやすさ向上（セクション分割など）
- [x] ルールオプションをテーブルに追加
  - [x] lint-to-markdown.tsのテーブル出力にオプション列を追加
  - [x] オプションをJSON文字列に変換して表示
  - [x] 適切なフォーマットとインデントの実装
  - [x] オプションのない場合は空文字列を表示

## CI/CD対応と検証コマンド

- [x] lintコマンドの実装
  - [x] コマンドライン引数の定義
    - [x] `--biome-args <args>`：`biome rage`に渡す追加オプション
    - [x] `--eslint-config <path>`：ESLint設定ファイルのパス指定
    - [x] `--output <file.md>`：検証対象のマークダウンファイル
    - [x] `--update`：不一致時に自動更新するフラグ
    - [x] `--verbose`：詳細な比較結果と差分を表示
  - [x] 実行フローの実装
    - [x] 既存のマークダウンファイルの読み込み
    - [x] 現在の設定からの一時マークダウン生成
    - [x] ファイル内容の比較ロジック
    - [x] 不一致検出時の処理（エラー表示または更新）
  - [x] マークダウン比較のためのユーティリティの実装
    - [x] `src/utils/diff-utils.ts`の作成
    - [x] マークダウン内容の正規化処理（改行や空白の違いを吸収）
    - [x] 差分の検出と表示機能
  - [x] リンターコマンドの実装（src/commands/lint.ts）
    - [x] lintコマンドのエントリポイント作成
    - [x] オプション解析と検証
    - [x] generateロジックの再利用（出力先を一時ファイルに変更）
    - [x] ファイル比較処理
    - [x] 終了コード管理（成功時0、エラー時1）
  - [x] ユニットテストの実装
    - [x] 純粋関数のテスト実装
    - [x] ファイルシステム操作を伴う部分は統合テストとしてスキップ設定
- [x] CIパイプライン連携
  - [x] CI連携のためのドキュメント作成（docs/ci-integration.md）
  - [x] CI設定例の提供（GitHub Actions, GitLab CI）
  - [x] 適切な終了コードの管理によるCI連携サポート

## デバッグ機能の追加

- [x] 詳細モードの実装
  - [x] `--verbose` フラグの追加
  - [x] `VERBOSE=true` 環境変数のサポート
  - [x] biome rageの出力結果を表示
  - [x] bundleRequireの結果を表示 
  - [x] ロガーの詳細モード強化
  - [x] README.mdのドキュメント更新

## テスト・デプロイ

- [ ] ユニットテスト実装（80%以上のカバレッジ）
  - [x] カバレッジレポート設定完了（@vitest/coverage-v8）
  - [x] コードカバレッジのしきい値設定（80%）
  - [ ] 現在のカバレッジ: lines(55.58%), branches(79.86%), functions(83.09%)
  - [ ] カバレッジ向上のためのテスト追加が必要
- [ ] E2Eテスト実装（実際のプロジェクトでの動作確認）
- [ ] npm公開準備（README, CHANGELOG作成）
- [x] GitHub Actions CI設定
  - [x] 基本CI設定（lint, test, build）
  - [x] カバレッジレポート実行をCIに追加

## 拡張対応

- [ ] プラグイン機構設計・実装
- [ ] 将来的なPrettier, Stylelint等の対応準備
- [ ] ESLintルール説明のクローリング機能対応
  - [ ] ESLintドキュメント用クローラースクリプトの作成
  - [ ] ESLint用のルール説明データ構造設計
  - [ ] ESLintマークダウン生成にルール説明を統合