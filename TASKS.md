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

---

## T-002 点数早見表ダイアログを親/子スワイプカルーセル化

### 目的 / 変更内容
点数早見表ダイアログ（`ScoreTableDialog`）で、現状**トグルボタンでのみ**切り替えている
親表・子表を、**スワイプで左右に切り替えられるカルーセル**にする。トグルは残し、スワイプと双方向同期する。
（正典: SPEC.md §4.12「点数早見表ダイアログ」／§8.1 オーバーレイ）

### 確定した設計判断
- **スライド**: **親／子の2枚**（各パネルに 符×翻の本表＋満貫区分行を含む）。
- **切替UI**: 既存の**親/子トグルを残し、スワイプと双方向同期**。デスクトップ・非タッチでもトグルで切替可。
- **実装方式**: **CSS `scroll-snap`**（横スクロールコンテナ＋`scroll-snap-type: x mandatory`、各パネル100%幅）。
  ライブラリ追加・手動touchハンドラは採用しない。
- **両パネル常時描画**: 現状の片側条件描画（`side === "dealer" ? ... : ...`）をやめ、**両パネルをDOMに常時描画**する（scroll-snap成立の前提）。表データはモジュール読込時に生成済みでコスト増は軽微。
- **入れ子スクロール排除**: **横軸はカルーセルの1軸のみ**。表内の横スクロール（`.st-scroll { overflow-x: auto }`）を**廃止**し、表を `table-layout: fixed` でパネル幅に収める。極小端末はフォント縮小で吸収。**ダイアログ本文の縦スクロールは残す**。
- **同期**: スクロール位置→state は `IntersectionObserver`（各パネル、閾値 ~0.55）で判定。
  トグル押下→対象パネルへ `scrollTo({ behavior: "smooth" })`、**`prefers-reduced-motion` 時は `"auto"`（即時ジャンプ）**。
- **アクセシビリティ**: トグルの `aria-pressed` を維持、スクロールコンテナに `aria-label`。各パネルの `親`/`子` 見出し（h3）は残す。色のみ依存にしない。

### 影響ファイル
- `src/components/ScoreTableDialog.tsx` — 条件描画→両パネル描画、scroll-snapコンテナ、`IntersectionObserver`/`scrollTo` 同期
- `src/components/scoreTable.css` — `.st-body` を横スクロール＋スナップ化・パネル100%幅、`.st-scroll` の横スクロール撤去、reduced-motion対応
- `src/components/ScoreTableDialog.test.tsx` — **新規**（現状ダイアログ単体テストは無い）

### 実装ステップ
1. **`ScoreTableDialog.tsx`**:
   - `.st-body` 内に**親・子の2パネルを常に描画**する横スクロールコンテナ（例: `.st-carousel`）を置き、各パネルを `.st-panel`（100%幅・`scroll-snap-align: start`）でラップ。
   - コンテナ要素に `ref` を持たせ、各パネルに `IntersectionObserver`（root=コンテナ、閾値 ~0.55）を張って、可視側で `side` state を更新する（スワイプ→トグル同期）。
   - `side` 変化がユーザーのトグル操作由来のとき、対象パネルへ `scrollTo`。`window.matchMedia("(prefers-reduced-motion: reduce)")` を見て `behavior` を切替。無限同期ループを避けるため「トグル起点のスクロール」と「スクロール起点のstate更新」を区別する（フラグ/直近値ガード等）。
   - `open` で開いた直後は現在の `side` に**アニメーションなしで**位置合わせする。
2. **`scoreTable.css`**:
   - `.st-carousel { display:flex; overflow-x:auto; scroll-snap-type:x mandatory; }`、`.st-panel { flex:0 0 100%; scroll-snap-align:start; }`。
   - `.st-scroll { overflow-x: auto }` の横スクロールを撤去（表をパネル幅に収める前提のスタイルへ）。
   - `@media (prefers-reduced-motion: reduce)` で `scroll-behavior: auto`。スクロールバーは必要なら視覚的に隠す。
3. **テスト（`ScoreTableDialog.test.tsx` 新規）**:
   - jsdomはスクロール/スナップ/`IntersectionObserver` 未実装のため、`IntersectionObserver` を**モック**する。
   - ①親・**両パネルが同時にDOM描画**される、②トグル押下でアクティブ側（`aria-pressed`）が切替、③Observer発火をシミュレートしスクロール→トグル状態が同期、を検証。
   - 実スワイプのピクセル挙動はjsdom範囲外として検証しない（計画上の割り切り）。

### 受け入れ基準
- 早見表ダイアログで、親表・子表を**スワイプで左右に切り替えられる**。
- 親/子トグルとスワイプが**双方向同期**する（トグル→スクロール、スワイプ→`aria-pressed`）。
- 横方向の入れ子スクロールが無く、スワイプが表内スクロールに吸われない。
- `prefers-reduced-motion` 指定時はトグル切替が即時ジャンプになる。
- 早見表の数値は従来どおり `calculatePayment` 由来で、クイズ採点と食い違わない。
- `npm test` / `npm run lint` が通る。

---

## T-003 点数早見表の親/子トグル：選択強調を配色で明確化

### 目的 / 変更内容
点数早見表ダイアログ（`ScoreTableDialog`）の親/子トグルで、**非選択側の文字色がteal系のため選択中と紛らわしい**問題を是正する。
形状（ピル型セグメントコントロール）は変えず、**非選択側の配色・文字ウェイトのみ**変更して対比を強める。
（正典: SPEC.md §4.12「トグルの選択強調」）

### 確定した設計判断
- **選択中（アクティブ）側**: 現状のまま変更しない（teal塗り・白文字・グロー影・`font-weight: 800`）。
- **非選択側**:
  - 文字色: teal系（`#1e8c86`）→ `var(--color-text-sub)`（`#6a6a6a`、既存の共通ミュートトークン）。
  - 背景: 透明 → 薄いグレー背景（不透明。白ベースで合成し、コンテナの薄teal地に対しても濁らないようにする。`fu-parts.css` の `.fu-parts-choice-btn--muted` と同様の考え方）。
  - `font-weight`: `800` → `600`。選択中の `800` との差で強弱をつける。
- **hover挙動**: 非選択ボタンhover時のteal薄染まり（`color-mix(in srgb, #2ba8a2 16%, transparent)`）は変更しない。
- **ダークモード**: 本アプリは非対応のため考慮不要。

### 影響ファイル
- `src/components/scoreTable.css` — `.st-toggle-btn`（非選択ベース）のスタイル変更

### 実装ステップ
1. **`scoreTable.css`**:
   - `.st-toggle-btn` のベーススタイルを、非選択状態の見た目として再定義する。
     - `color: var(--color-text-sub)`
     - `background`: 白ベースで合成した薄いグレー（例: `color-mix(in srgb, var(--color-text-sub) 8%, #fff)` 相当。コンテナ背景 `#e8f6f5` の上に乗っても不透明で濁らないこと）
     - `font-weight: 600`
   - `.st-toggle-btn--active` は現状の宣言（`background: #2ba8a2; color: #fff8e7; box-shadow: ...`）をそのまま維持しつつ、`font-weight: 800` を明示的に上書きする（ベース側が `600` になるため）。
   - hover用ルール（`.st-toggle-btn:not(.st-toggle-btn--active):hover`）は変更しない。
2. **目視確認**: `/quiz` または `/convert` から早見表ダイアログを開き、親/子トグルの非選択側が薄いグレー・選択側がteal塗りで明確に区別できること。

### 受け入れ基準
- 非選択トグルボタンの文字色が `var(--color-text-sub)` になっている。
- 非選択トグルボタンの背景が薄いグレー（不透明）になっている。
- 非選択トグルボタンの `font-weight` が `600`、選択中は `800` のままである。
- 選択中側の見た目（teal塗り・白文字・グロー影）に変更がない。
- hover挙動に変更がない。
- `npm test` / `npm run lint` が通る。

---

## T-004 狭幅時、ドラ表示牌6枚（表3+裏3）でリーチ棒が原因の折り返しを緩和

### 目的 / 変更内容
点数計算モード（`QuizPage`）で、リーチ時に表ドラ表示牌＋裏ドラ表示牌の合計枚数が多いケース
（例: 表3枚＋裏3枚＝6枚）になると、`dora-indicator-group` の幅が広がり、`quiz-tile-header` の
折り返し（`flex-wrap: wrap`）によってドラ表示ブロックごと次の行に落ちてしまう。
これを緩和するため、**狭幅時のみリーチ棒画像（`.riichi-indicator-stick`）の幅を少し縮小**する。
（正典: SPEC.md §4.1「リーチ棒画像サイズ（狭幅対応）」）

### 確定した設計判断
- **対応範囲はリーチ棒の幅のみ**。`gap`・`padding` など他のレイアウト要素は変更しない
  （縮小だけでは極狭幅で解消しきらない可能性があるが、今回のスコープでは許容する既知の制限とする）。
- **適用幅**: 既存の狭幅ブレークポイント（`--bp-sm`, 画面幅640px未満）のみ。PC幅（640px以上）は
  現状の92px据え置き。
- **縮小後の幅**: 76px程度（現状比 約-17%）。`height: auto` のままアスペクト比は保持。
- **既知の制限**: 極端に狭い画面幅（360px程度以下）では、6枚のケースでもなお折り返しが解消しきらない
  場合がある。これは受け入れ、追加のgap調整などは今回のスコープ外とする。
- **影響範囲**: `.riichi-indicator-stick` は `QuizTileHeader` の共有スタイルのため、最終点数モード
  （`QuizPage`）・符計算モード（`FuQuizPage`）の両方に適用される。符計算モードはドラ表示牌自体を
  出さないため折り返し問題自体は発生しないが、リーチ棒の見た目サイズはこちらも小さくなる。
- **テスト**: 既存テスト（`QuizPage.test.tsx` / `FuQuizPage.test.tsx`）は `.riichi-indicator-stick`
  の存在のみ検証しており、幅変更に伴うテストコードの修正は不要。自動の視覚回帰テストは無いため、
  手動確認で代替する。

### 影響ファイル
- `src/components/quiz.css` — `.riichi-indicator-stick` の狭幅時オーバーライド追加

### 実装ステップ
1. **`quiz.css`**: 既存の `@media (--bp-sm) { ... }` ブロック（`.dora-indicator-tiles` の gap 圧縮と
   同じ並び）に `.riichi-indicator-stick { width: 76px; }` を追加する。PC向けの基本ルール
   （`width: 92px`）は変更しない。
2. **手動確認**:
   - 開発サーバでブラウザ幅を375px程度に縮小し、点数計算モードでリーチ棒が一回り小さく表示される
     ことを確認する。
   - 表3枚+裏3枚（槓2回＋リーチ）のケースを再現する（リロードを繰り返すか、開発者ツールで
     `.dora-indicator-tiles` に一時的にダミー牌を6枚挿入して検証してもよい）。この状態で
     ドラ表示ブロックが折り返さず1行に収まる（もしくは縮小前より折り返しにくくなっている）ことを確認する。
   - PC幅（640px以上）でリーチ棒サイズが従来どおり92pxのままであることを確認する。

### 受け入れ基準
- 狭幅（640px未満）でリーチ棒画像の幅が76px程度に縮小される。
- PC幅（640px以上）でリーチ棒画像の幅は92pxのまま変わらない。
- 表3+裏3のドラ表示ケースで、縮小前より折り返しが起きにくくなっている（完全解消は必須要件としない）。
- 既存テスト（`QuizPage.test.tsx` / `FuQuizPage.test.tsx`）に変更なく通る。
- `npm test` / `npm run lint` が通る。
