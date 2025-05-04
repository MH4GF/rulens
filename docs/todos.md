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
- [ ] CLI設定（bin指定など）

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

### ビルド・テスト環境設定
- [ ] tsup設定
  - [ ] tsup.config.tsファイルの作成
  - [ ] エントリーポイントとビルド設定
  - [ ] バンドルとデクラレーションファイルの設定
- [ ] Vitestテスト環境
  - [ ] vitest.config.tsの作成
  - [ ] テストディレクトリ構造とサンプルテストの作成
  - [ ] カバレッジ設定（80%以上）

### ディレクトリ構造整備
- [ ] src/ディレクトリと基本ファイル構造作成
- [ ] サブディレクトリ作成（commands/, tools/, markdown/, utils/）
- [ ] README.mdの初期版作成

## コア機能実装

- [ ] CLI基盤実装（commander.js）
- [ ] バイナリ解決ロジック実装（ローカル/グローバル）
- [ ] ユーティリティ（logger, executor）実装

## Biome対応（優先実装）

- [ ] Biome実行ロジック実装
- [ ] Biome出力結果のパース・整形
- [ ] Biome設定をMarkdown形式に変換

## ESLint対応

- [ ] ESLint実行ロジック実装
- [ ] ESLint出力結果のパース・整形
- [ ] ESLint設定をMarkdown形式に変換

## Markdown生成

- [ ] Markdown生成エンジン実装
- [ ] 設定出力テンプレート作成
- [ ] ファイル出力機能実装

## テスト・デプロイ

- [ ] ユニットテスト実装（80%以上のカバレッジ）
- [ ] E2Eテスト実装（実際のプロジェクトでの動作確認）
- [ ] npm公開準備（README, CHANGELOG作成）
- [ ] GitHub Actions CI設定

## 拡張対応

- [ ] プラグイン機構設計・実装
- [ ] 将来的なPrettier, Stylelint等の対応準備