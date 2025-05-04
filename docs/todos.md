# rulens 実装タスクリスト

## プロジェクト基盤構築

- [ ] プロジェクト初期化（package.json）
- [ ] tsconfig.json設定（[@mh4gf/configs](https://www.npmjs.com/package/@mh4gf/configs) を使用）
- [ ] Biome設定（[@mh4gf/configs](https://www.npmjs.com/package/@mh4gf/configs) を使用）
- [ ] ESLint設定（[@mh4gf/eslint-config](https://www.npmjs.com/package/@mh4gf/eslint-config) を使用）
- [ ] TypeScript, tsupのセットアップ
- [ ] Vitestテスト環境のセットアップ
- [ ] ディレクトリ構造の作成

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