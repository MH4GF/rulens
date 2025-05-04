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
- [ ] 新規ディレクトリ作成
  - [ ] src/data/ ディレクトリの作成（ルール説明JSONデータ用）
  - [ ] ルートに scripts/ ディレクトリの作成（開発用スクリプト用）
- [ ] README.mdの初期版作成

## コア機能実装

- [x] CLI基盤実装（commander.js）
- [x] バイナリ解決ロジック実装（ローカル/グローバル）
- [x] ユーティリティ（logger, executor）実装

## Biome対応（優先実装）

- [x] Biome実行ロジック実装
- [x] Biome出力結果のパース・整形
- [x] Biome設定をMarkdown形式に変換
- [ ] Biomeルール説明のクローリング機能実装
  - [ ] `scripts/`ディレクトリの作成（開発用スクリプト用）
  - [ ] クローラースクリプトの作成（`scripts/crawl-biome-rules.ts`）
  - [ ] Node.js fetch + HTMLパーサーによるクローリング実装
  - [ ] ルールID（カテゴリー/ルール名）からURLへの変換ロジック実装
  - [ ] 公式サイトからルール説明の抽出ロジック実装
  - [ ] 抽出データを`src/data/biome-rules.json`として保存する機能実装
  - [ ] package.jsonにスクリプト追加（`"crawl": "tsx scripts/crawl-biome-rules.ts"`）
  - [ ] マークダウン出力時にルール説明を統合する機能実装

## ESLint対応

- [ ] ESLint実行ロジック実装
- [ ] ESLint出力結果のパース・整形
- [ ] ESLint設定をMarkdown形式に変換

## Markdown生成

- [x] Markdown生成エンジン実装
- [x] Biomeルール出力テンプレート作成
- [ ] ESLintルール出力テンプレート作成
- [x] ファイル出力機能実装
- [ ] ルール説明を含むマークダウン形式への拡張
  - [ ] BiomeToMarkdown関数の拡張（ルール説明を含める）
  - [ ] データ構造の拡張（BiomeRuleDescriptionインターフェース）
  - [ ] 出力例の更新とテスト

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