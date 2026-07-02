# 麻雀 点数計算ドリル

麻雀の点数計算をスマホWebで反復練習するドリルアプリ。

- 仕様: [SPEC.md](./SPEC.md)
- 実装計画: [TASKS.md](./TASKS.md)
- 開発ガイド: [CLAUDE.md](./CLAUDE.md)

## セットアップ

```bash
npm install
```

## 開発コマンド

```bash
npm run dev      # 開発サーバ
npm run build    # 本番ビルド（型チェック含む）
npm run preview  # ビルドのプレビュー
npm test         # ユニットテスト（Vitest, 1回実行）
npm run test:watch # ユニットテスト（watchモード）
npm run test:e2e  # E2Eテスト（Playwright。本番ビルドをプレビューサーバで起動して検証）
npm run build:bank # 問題バンク(src/data/problemBank.json)を再生成
npm run lint      # ESLint
npm run format    # Prettier
```

## E2Eテストについて

`e2e/quiz-flow.spec.ts` は `@playwright/test` で実装した、出題→回答→解説→次の問題→成績という
一連の学習フローの回帰テスト。`npm run test:e2e` は自動で本番ビルドをプレビューサーバ
（`vite preview`）で起動し、実際に配信されるものと同じ静的ファイルに対してデスクトップ/モバイルの
両ビューポートで検証する。選択肢はシャッフルされ正誤も手牌もランダムなため、テストは特定の正解を
前提とせず構造的な整合性（選択肢の表示形式、遷移、エラー無し等）を検証する設計にしている。

## 問題バンクについて

`src/data/problemBank.json` は手書きの正解データではなく、`scripts/buildProblemBank.ts` に定義した
手牌（コンパクト記法）を実際の点数計算エンジン(`scoreHand`)にかけて得た出力をそのまま「正解」として
書き出したもの。エンジンとバンクが乖離することはなく、`src/data/problemBank.test.ts` で全問について
再計算結果とバンクの記載が一致することを継続的に検証する（回帰テストのフィクスチャを兼ねる）。

新しい問題を追加する場合は `scripts/buildProblemBank.ts` の `specs` 配列に手牌定義を追加し、
`npm run build:bank` を実行して JSON を再生成する。
