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
- [ ] Vitestテスト環境
  - [ ] vitest.config.tsの作成
  - [ ] テストディレクトリ構造とサンプルテストの作成
  - [ ] カバレッジ設定（80%以上）

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

- [ ] Lintツール検出の改善
  - [ ] Biome/ESLint各ツールの存在を個別に検出するロジック実装
  - [ ] 見つかったツールのみを実行するように変更
  - [ ] 全ツールがなかった場合のみエラー表示
- [ ] ESLint設定ファイル解決の改善
  - [ ] findUp を使った設定ファイル検索ロジック実装
  - [ ] 複数の設定ファイル形式サポート（`.eslintrc.*` など）
  - [ ] 設定ファイルがない場合のエラーハンドリング改善
- [ ] 出力ディレクトリ関連
  - [ ] `docs` ディレクトリがない場合は自動作成するロジック実装
  - [ ] 出力先ディレクトリの親ディレクトリ存在確認ロジック実装

## 出力フォーマットの最適化

- [ ] severityがoffのルールは出力しない機能実装
  - [ ] lint-to-markdown.tsにフィルタリング機能を追加
  - [ ] テストケースの追加
- [ ] ESLintのマークダウン出力からseverityを削除
  - [ ] ESLint特有のseverity表示を削除
  - [ ] カテゴリ表示の最適化
- [ ] 出力されるMarkdownの改善
  - [ ] TOCの自動生成機能強化
  - [ ] カテゴリ説明の拡充（ESLint）
  - [ ] ドキュメント全体の読みやすさ向上（セクション分割など）

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
- [ ] E2Eテスト実装（実際のプロジェクトでの動作確認）
- [ ] npm公開準備（README, CHANGELOG作成）
- [ ] GitHub Actions CI設定

## 拡張対応

- [ ] プラグイン機構設計・実装
- [ ] 将来的なPrettier, Stylelint等の対応準備
- [ ] ESLintルール説明のクローリング機能対応
  - [ ] ESLintドキュメント用クローラースクリプトの作成
  - [ ] ESLint用のルール説明データ構造設計
  - [ ] ESLintマークダウン生成にルール説明を統合