# TASKS.md — 実装計画

## T-001 リーチ表示をロン/ツモの右隣へ移動（最終点数モードのみ）

### 目的 / 変更内容
最終点数モード（`QuizPage`／点数計算）で、リーチの表示を**上段の局条件バッジ列から撤去**し、
**アガリ牌（ツモ/ロンの色付き枠）の右隣**（ドラ表示牌の左）へ移す。
横の並びは `ツモ/ロン → リーチ → ドラ` の順。（正典: SPEC.md §4.1「リーチ表示の位置」）

### 確定した設計判断
- **見た目**: 既存の `badge badge-riichi` の見た目のまま置く（枠付きタイルグループ様式には寄せない）。
- **非リーチ時**: 同じ幅の枠を**常に確保して空表示**。リーチ有無でドラ表示牌の位置を動かさない。
- **並び順**: `ツモ/ロン → リーチ → ドラ`。
- **スコープ**: **最終点数モード（`QuizPage`）のみ**。上段バッジ列からはリーチを撤去する。
  符計算モード（`FuQuizPage`）・符分解モード（`FuPartsQuizPage`）・点数換算モード（`ConvertQuizPage`）は**変更しない**。

### 影響ファイル
- `src/components/QuizTileHeader.tsx` — リーチ枠の追加（共有コンポーネント）
- `src/components/QuizPage.tsx` — 上段からリーチ撤去＋タイルヘッダーへリーチ表示を有効化
- `src/components/quiz.css`（＋必要に応じて `quizFlip7.css`） — リーチ枠のレイアウト/整列
- `src/components/QuizPage.test.tsx` / `QuizTileHeader` 用テスト — 位置の検証

### 実装ステップ
1. **`QuizTileHeader.tsx`**: `showRiichi?: boolean`（既定 `false`）を追加。
   `true` のとき、`win-indicator-section` と `dora-indicator-section` の**間**に
   リーチ用セクション（例: `.riichi-indicator-section`）を描画する。
   - `problem.conditions.riichi === true` → 既存 `badge badge-riichi` を描画。
   - `false` → 同幅の空スペーサー（`aria-hidden`）を描画し、枠だけ確保する。
   - `showDora` とは独立（`showDora=false` でもリーチ枠は出せる設計にするが、当面 QuizPage 専用）。
2. **`QuizPage.tsx`**:
   - `<QuizConditions ... showRiichi={false} />` を渡し、上段バッジ列からリーチを撤去。
   - `<QuizTileHeader ... showRiichi />` を渡し、新位置でのリーチ表示を有効化。
3. **CSS**: `.riichi-indicator-section` を追加。
   - バッジを 2 行（ラベル＋牌）構成のセクション高に対して**縦中央**に置く。
   - リーチ/非リーチで**幅を固定**（`min-width`）してドラ位置を安定させる。
   - `.quiz-tile-header` の `justify-content`（現状 `space-between`）が 3 セクションで崩れないか確認し、
     必要なら `gap` ベースの間隔へ微調整する。
4. **テスト**:
   - リーチ手: リーチ表示がアガリ牌セクション側（タイルヘッダー内）に出て、上段バッジ列には**出ない**こと。
   - 非リーチ手: タイルヘッダー内にリーチバッジが**出ない**が、枠（空表示）は確保されること。
   - `FuQuizPage` / `FuPartsQuizPage` が `showRiichi` 既定 `false` で**従来どおり**であること（回帰確認）。

### 受け入れ基準
- 最終点数モードで、リーチが `ツモ/ロン → リーチ → ドラ` の順に表示される。
- 非リーチ時もドラ表示牌の位置が変わらない。
- 上段の局条件バッジ列にリーチが出ない（最終点数モード）。
- 他モードの表示・テストに影響がない。
- `npm test` / `npm run lint` が通る。
