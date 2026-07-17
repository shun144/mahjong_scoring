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

---

## T-005 サイドバーに他モードへの遷移ボタンを追加

### 目的 / 変更内容

出題・解説系6画面（`/quiz`・`/result`・`/fu/quiz`・`/fu/result`・`/fu/parts`・`/convert`）のサイドバー
（`SidebarPageHeader`→`Sidebar`）に、**現在表示中のモードを除いた他モードへの遷移ボタン**を追加する。
（正典: SPEC.md §8.5「モード切替ボタン」）

### 確定した設計判断

- モードは4つ: 点数計算（`/quiz`+`/result`）／符計算（`/fu/quiz`+`/fu/result`）／符分解（`/fu/parts`）／
  点数換算（`/convert`）。**出題画面と解説画面は同一モードとして扱う**（モードファミリー単位）。
- **現在のモードのボタンは非表示**（無効化表示ではなく完全に除外。最大3つ表示）。
- **サイドバー内の並び順**: `ホーム` → 見出し「他のモードで練習」＋モードボタン(最大3) → `成績`
  （成績非連携モードは従来どおり「成績」を出さない）。
- **`currentMode` は呼び出し元ページが明示的に prop として `SidebarPageHeader` へ渡す**
  （`backTo`・`showStats` と同様の設計。URL パターンからの自動判定はしない）。
- **モード定義の共有**: `src/config/modes.ts`（新規）に id・label・path・アイコン(絵文字)を持つ配列を定義し、
  `HomePage` のモード選択カードと本機能の両方から参照する（表示名・パスの二重管理を避ける）。
  `HomePage` 固有の説明文(`desc`)・装飾牌(`TileFace`)・CSS クラスは `HomePage` 側に残し、
  共有するのは最小限の情報にとどめる。
- **遷移**: 各モードボタンは対応モードの出題画面（点数計算→`/quiz`、符計算→`/fu/quiz`、
  符分解→`/fu/parts`、点数換算→`/convert`）への通常の `<Link>`。確認ダイアログなし、state 受け渡しなし
  （成績ボタンの `backTo`/`problem` とは異なり、単純遷移）。
- **アイコン**: 絵文字。仮案: 点数計算🧮／符計算🔢／符分解🧩／点数換算📐
  （既存のホーム🏠・成績📊と同系統。最終デザインは `style` スキルで調整可）。

### 影響ファイル

- `src/config/modes.ts` — 新規。モード定義（id・label・path・icon）の配列。
- `src/components/HomePage.tsx` — モード選択カードの定義を `modes.ts` 参照に置き換え
  （label・path の直書きを解消。desc・CSS クラスは維持）。
- `src/components/SidebarPageHeader.tsx` — `currentMode` prop を追加。`modes.ts` から自モード以外を
  抽出してサイドバー内に「他のモードで練習」セクションとして描画。
- `src/components/QuizPage.tsx` / `ResultPage.tsx` — `currentMode="score"` を渡す。
- `src/components/FuQuizPage.tsx` / `FuResultPage.tsx` — `currentMode="fu"` を渡す。
- `src/components/FuPartsQuizPage.tsx` — `currentMode="fu-parts"` を渡す。
- `src/components/ConvertQuizPage.tsx` — `currentMode="convert"` を渡す。
- `src/components/sidebar.css` — セクション見出し（「他のモードで練習」）のスタイル追加。
- 各ページの既存テスト（`QuizPage.test.tsx`・`ResultPage.test.tsx`・`FuQuizPage.test.tsx`・
  `FuResultPage.test.tsx`・`FuPartsQuizPage.test.tsx`・`ConvertQuizPage.test.tsx`）＋
  `SidebarPageHeader` 用テスト（新規 or 既存拡張）

### 実装ステップ

1. **`src/config/modes.ts`（新規）**: モード定義の配列を作る。
   ```ts
   type ModeId = "score" | "fu" | "fu-parts" | "convert";
   interface ModeDef {
     id: ModeId;
     label: string;
     path: string;
     icon: string;
   }
   ```
   `score`=点数計算モード(`/quiz`,🧮)／`fu`=符計算モード(`/fu/quiz`,🔢)／
   `fu-parts`=符分解モード(`/fu/parts`,🧩)／`convert`=点数換算モード(`/convert`,📐)。
2. **`SidebarPageHeader.tsx`**:
   - `currentMode: ModeId` prop を追加（必須）。
   - `modes.ts` から `m.id !== currentMode` でフィルタした配列を、`ホーム` の直後・`成績` の前に
     「他のモードで練習」の見出し＋リンク一覧として描画する。
   - 各リンクはクリックで `setOpen(false)`（既存のホーム/成績リンクと同様）。
3. **各ページコンポーネント**: `SidebarPageHeader` 呼び出しに `currentMode` を追加
   （`QuizPage`/`ResultPage`→`"score"`、`FuQuizPage`/`FuResultPage`→`"fu"`、
   `FuPartsQuizPage`→`"fu-parts"`、`ConvertQuizPage`→`"convert"`）。
4. **`HomePage.tsx`**: モード選択カードの `to`・タイトル文言を `modes.ts` から取得するようリファクタ
   （`desc`・アイコンの `TileFace`・CSS 修飾クラスはモードごとに個別マップとして残す）。
5. **`sidebar.css`**: 見出しラベル用のスタイル（例: `.sidebar-nav-heading`）を追加。
6. **テスト**:
   - 各ページで自モードのボタンが出ない・他3モードのボタンが出ることを確認。
   - `/result` は「点数計算モード」ボタンが出ない（モードファミリー判定）ことを確認。
   - `/fu/parts`・`/convert` は「成績」リンクが出ないまま、モードボタンだけ追加されることを確認。
   - モードボタン押下で対応パスへ遷移し、サイドバーが閉じることを確認。

### 受け入れ基準

- サイドバーを持つ6画面すべてで、現在のモードを除いた他モードへの遷移ボタンが
  「ホーム」の下・「成績」の上に表示される。
- `/result`・`/fu/result` はそれぞれ `/quiz`・`/fu/quiz` と同じモード扱いで、自モードのボタンが出ない。
- モードボタンは確認なしで即座に遷移する。
- 符分解・点数換算モードの画面では「成績」リンクが引き続き出ない。
- `HomePage`・`SidebarPageHeader` がモード定義を `modes.ts` から共有し、ラベル・パスの二重管理がない。
- `npm test` / `npm run lint` が通る。

---

## テンポ改修（T-006〜T-008）— 背景

差別化の核＝**テンポの良さ**（サクサク回せる）を、体感と証拠で成立させるための改修群。
現行は回答ごとに `/quiz→/result→/quiz` の2遷移＋解説フルページを挟むため、「スクロールして次へ」という
競合批判が自分にも刺さる状態。以下で「遷移ゼロ・正解時は無スクロール・ワンタップ次へ」を構造で達成する。
テンポは集客コピーには載せず（検索意図優先）、着地後の体験と、その様子を切り取ったループ動画（別途Cで整備）で訴求する。

**依存関係**: T-006（土台）→ T-007・T-008（並行可）。

---

## T-006 結果のインライン化（`/result`遷移を廃し出題画面で完結）

### 目的

回答のたびに `/quiz→/result→/quiz` と2回ページ遷移する現行フロー（`QuizPage.tsx` の `navigate("/result", …)`）を
廃止し、**出題画面上で結果を表示*T*する。テンポの中核＝「遷移ゼロの1枚の面」を構造で達成する。
**T-007・T-008 の土台**（この面が無いと解説折りたたみもカウンタも載らない）。

### 確定した設計判断

- 回答時、`QuizPage` に `answered: { selected; isCorrect } | null` の状態を持たせ、`navigate` せず同画面で結果ブロックを描画する。
- 結果ブロックは `ResultPage.tsx` の中身（正誤・答え・内訳・役・計算式・高点法別解）を**共有コンポーネント化**して再利用する
  （`ResultPage` はディープリンク/後方互換のため残すが、通常フローは通らない）。
- 「次へ」= `answered` をクリアし `nextProblem()`。1タップ・ノーロード。
- 現行の「問題に戻る」復習導線（`ResultPage.tsx` の `state:{review:true}`）は、インライン化で*同画面に留まる*ため不要化。
  復習の二重計上防止ロジック（`QuizPage.tsx`）は「同一問題を再表示中は `recordAnswer` しない」条件に読み替える。
- 採点記録 `recordAnswer(problem, isCorrect)` の呼び出しタイミング・意味は現行踏襲（回答確定時に1回）。

### 影響ファイル

- `src/components/QuizPage.tsx` — `answered` 状態・インライン結果描画・「次へ」ハンドラ
- `src/components/ResultPage.tsx` → 中身を `ResultContent`（新規・共有）へ抽出
- `src/components/QuizPage.test.tsx` / `ResultPage.test.tsx` — 遷移前提のテストをインライン前提へ改修

### 受け入れ基準

- 4択タップで **`/result` へ遷移せず**、出題画面上に正誤・答え・（内訳）が表示される。
- 「次へ」1タップで次問が出る。**ページリロード/ルート遷移が発生しない**。
- 回答→結果→次問の**1周が無スクロールで画面録画できる**（＝Cのループ動画撮影可否の判定条件）。
- 採点記録が従来どおり1回だけ計上される（復習再表示では計上しない）。
- `npm test` / `npm run lint` が通る。

---

## T-007 解説の条件付き折りたたみ（正解=畳む／不正解=自動展開）

### 目的

インライン結果内の解説（内訳・役・計算式・高点法別解）を、**正解時はデフォルト非表示、不正解時はデフォルト展開**にする。
テンポ（正解のハッピーパス）と学習・信頼（ミスの瞬間）を両立させる。**T-006 に依存**。

### 確定した設計判断

- 折りたたみUI: 見出し「解説はこちら ▼」トグル。展開/収納は**同画面インライン**（別遷移しない）。
- 初期表示: `isCorrect === true` → 収納、`false` → 展開。ユーザーは手動で再操作可。
- **非懲罰の原則を崩さない**: 不正解展開は「間違い＝損」の演出にしない（自動で内訳を出すだけ。赤枠で咎める等はしない）。
- 展開時の中身は現行 `ResultPage` の内訳（`FuBreakdownContent`・役リスト・計算式・`interpretationNote`）をそのまま。
  **信頼はここの質で語らせる**方針なので、正解時に畳めても中身自体は削らない。

### 影響ファイル

- `src/components/QuizPage.tsx`（または抽出した `ResultContent`）— 折りたたみ状態と初期値の出し分け
- 対応する `*.test.tsx` — 正解時収納・不正解時展開・トグル動作の検証

### 受け入れ基準

- 正解時、解説はデフォルトで**畳まれ**、「解説はこちら ▼」で展開できる。
- 不正解時、解説はデフォルトで**展開**されている。
- 展開/収納はページ遷移なしで即時に切り替わる。
- 展開時の内訳内容が現行 `ResultPage` と一致する（回帰）。
- `npm test` / `npm run lint` が通る。

---

## T-008 モメンタムカウンタ（スループット主・ストリーク脇・非懲罰）

### 目的

テンポを*見える数字*に翻訳する。「**今日の回答数**」を主役、「**連続正解数**」を非懲罰の脇役として、
出題中も結果時も常時表示する。**T-006 に依存**。

### 確定した設計判断

- 表示2種: `今日の回答数`（スループット＝主・大きく）／`連続正解数`（脇・小さく）。
- **視覚的優先度**: 回答数を主指標として大きく、連続正解は添え物サイズ。同格に並べない
  （同格だと実質ストリーク中心化し「間違い＝損」に戻る）。
- **非懲罰**: 不正解で連続正解数は0に戻るが、**今日の回答数は絶対に減らさない**。
  リセットを赤字・×等で罰として煽らない（静かに0表示）。
- **常時可視**: 結果時だけでなく出題中も表示（積み上がる感覚を途切れさせない）。
- 永続化: `今日の回答数`は日付キーで localStorage 保存（日跨ぎでリセット）。
  `連続正解数`はセッション内（リロードで消えてよいかは要確認だが、当面セッション内）。`statsStore` に集約するのが自然。

### 影響ファイル

- `src/store/statsStore.ts`（周辺）— 今日の回答数・連続正解の集計/取得
- `src/components/QuizPage.tsx`（＋共有結果）— カウンタ表示
- `src/components/quiz.css` — 主/脇のサイズ・配置
- 対応する `*.test.tsx` — 加算・非懲罰（不正解で回答数不変）・日跨ぎリセットの検証

### 受け入れ基準

- 「今日の回答数」が主役として大きく、「連続正解数」が脇役として小さく、**出題中・結果時ともに**表示される。
- 正解で両方加算、**不正解で連続正解のみ0・回答数は不変**。
- 連続正解のリセットが罰として演出されない。
- 日付が変わると今日の回答数がリセットされる。
- `npm test` / `npm run lint` が通る。

---

## T-009 回答後の「次の問題へ」ボタンをスキップボタンと同一スタイルに統一（完了）

### 目的 / 変更内容

`QuizPage.tsx` の回答後（インライン結果表示時）に出る「次の問題へ」ボタンは、現状 `.btn-primary` +
`.rp-cta-arrow` を使っているが、`quizFlip7.css` に `.quiz-page .btn-primary` の上書きが無いため
`index.css` の素の標準ボタンのまま表示され、`.quiz-answer`（`flex-direction: column`・`align-items`
既定＝stretch）の中で**横幅いっぱいに引き伸ばされる**。未回答時のスキップボタン（`.qp-skip-btn`、
ティール枠のアウトラインピル・中央寄せ）とは見た目が一致しておらず、同一画面内でボタンスタイルに
一貫性がない。この不一致を解消し、回答後の「次の問題へ」もスキップボタンと同一の見た目にする。
（正典: SPEC.md §4.2「「次の問題へ」ボタンの見た目統一」）

### 確定した設計判断

- 回答後の「次の問題へ」ボタンを、未回答時のスキップボタンと**同一クラス**（`qp-skip-btn` /
  `qp-skip-arrow`）に差し替える。新規CSSは追加しない（既存の `.quiz-page .qp-skip-btn` 等を
  そのまま流用する）。
- DOM構造も未回答時と揃える: `ResultContent` は既存どおり `<section className="quiz-answer"
  aria-label="結果">` に残し、ボタンは別途 `<section className="quiz-skip">` に切り出す
  （`.quiz-answer` の `align-items` 既定値〔stretch〕でボタンが横幅いっぱいに引き伸ばされるのを避け、
  `.quiz-skip` の中央寄せ・コンテンツ幅と一致させるため）。
- `ResultPage.tsx`（解説画面）の「次の問題へ」は対象外。今回は `QuizPage.tsx` 内の
  回答後／未回答時の一貫性のみを扱う（`ResultPage.tsx` 側は別途検討時に改めてグリルする）。

### 影響ファイル

- `src/components/QuizPage.tsx` — 回答後ブロックの構造・クラス変更

### 実装ステップ

1. `QuizPage.tsx` の `answered` 分岐を変更する:
   - `<section className="quiz-answer" aria-label="結果">` は `ResultContent` のみを含める形に変更する。
   - ボタンを `<section className="quiz-skip">` に切り出し、`className="btn-primary"` →
     `"qp-skip-btn"`、`className="rp-cta-arrow"` → `"qp-skip-arrow"` に変更する。
2. 目視確認: `/quiz` で回答後、「次の問題へ」ボタンが未回答時のスキップボタンと同じ見た目
   （ティール枠アウトラインピル・中央寄せ）で表示されることを確認する。

### 受け入れ基準

- 回答後の「次の問題へ」ボタンが、未回答時のスキップボタンと同一の見た目（クラス・スタイル）になっている。
- ボタンが画面中央にコンテンツ幅で表示され、横幅いっぱいに引き伸ばされない。
- 既存テスト（`QuizPage.test.tsx`）が変更なく通る（role/name ベースの検証のため）。
- `npm test` / `npm run lint` が通る。

---

## T-010 点数計算モードのインライン正誤表示を符計算モードのFlip7スタイルに統一（完了）

### 目的 / 変更内容

`ResultContent.tsx`（正誤・答え・内訳カード・高点法別解を表示する共有コンポーネント）は
`QuizPage.tsx`（`.quiz-page` スコープ・インライン結果）と `ResultPage.tsx` /
`FuResultPage.tsx`（`.result-page` スコープ・別画面）の両方から使われている。しかし
Flip7デザイン（`docs/DESIGN.md`）の装飾は `resultFlip7.css` に `.result-page` スコープでのみ
定義されており、`quizFlip7.css` には対応する `.quiz-page` 向けの上書きが一切無い。そのため
符計算モードの解説画面（`/fu/result`）では正誤が色付きの「判定カード」（ティール/コーラルの枠＋
グロー影＋登場アニメーション）とゴールドピルの答え表示で強調されるのに対し、**点数計算モードの
インライン結果は同じ `ResultContent` を使っていながら無装飾（プレーンな色文字＋素の `.card`）の
まま**になっている。この見た目の差を解消し、点数計算モードのインライン結果を符計算モードの解説
画面と同じ Flip7 装飾にする。
（正典: SPEC.md §4.4「正誤表示の見た目統一」）

### 確定した設計判断

- **対象範囲は結果ブロック全体**: 判定カード（`.result-verdict-row`／`.result-verdict`）・
  答えのゴールドピル（`.result-answer`）・内訳カード（`.card`／`.result-breakdown`／
  `.rp-section-label`／`.yaku-list`／`.calculation-line`／`.fu-list`〔非 `--primary` 版のみ。
  `--primary` は `FuResultPage` 専用で `QuizPage` は使わないため対象外〕）・高点法別解カード
  （`.result-alt`）を含める。
- **実装方式**: 新規デザインは起こさず、`resultFlip7.css` の該当ルールを `quizFlip7.css` に
  **`.quiz-page` スコープで同等の値のままミラーリング追加**する（各画面のスタイルを独立スコープで
  管理する既存方針〔`quizFlip7.css` 冒頭コメント〕を踏襲。共通化リファクタは行わない）。
- **不足トークンの追加**: `.quiz-page` ブロックには `--fl-gold-ink`・`--fl-glow-gold-soft` が
  未定義のため、`resultFlip7.css` と同じ値で追加する（他のFlip7トークンは既に同一値で両ファイルに
  定義済みのため追加不要）。
- **アニメーション**: `@keyframes rp-pop` / `rp-rise` は `resultFlip7.css`（`ResultContent.tsx` が
  常時import）で既に定義されており、CSSのキーフレームはスコープを持たないため `QuizPage` でも
  そのまま参照できる。`quizFlip7.css` 側での再定義は不要。
- **「解説はこちら」トグル（`.rp-detail-toggle`）**: 符計算モードの解説画面には存在しない、
  点数計算モードのインライン結果専用のUIだが、周囲のカード装飾と浮かないよう **Flip7調に軽く
  スタイリング**する（色を既存の見出し類〔`.qp-section-label` 等〕と同系の `var(--fl-teal-dark)`
  にする程度の小さな調整。新規の装飾コンセプトは作らない）。
- **対象外**: `ResultPage.tsx`（`/result`、点数計算モードのディープリンク用の別画面）自体は変更
  しない。既に `.result-page` スコープで符計算モードと同じFlip7装飾を持っている。

### 影響ファイル

- `src/components/quizFlip7.css` — `.quiz-page` 向けの判定カード・内訳カード・高点法別解・
  トグルのスタイル追加、不足トークンの追加

### 実装ステップ

1. **`quizFlip7.css`**:
   - `.quiz-page` トークンブロックに `--fl-gold-ink: #8a6d00;`・
     `--fl-glow-gold-soft: 0 4px 14px rgba(255, 210, 63, 0.28);` を追加する。
   - `resultFlip7.css` の以下のルールを `.result-page` → `.quiz-page` に置き換えて追加する
     （値は変更しない。`--primary` 系・`meld-mark` 系〔`FuResultPage` 専用〕は除く）:
     - `.result-verdict-row`（`:has(.correct)` / `:has(.incorrect)` 含む）・登場アニメーション
     - `.result-verdict` / `.correct` / `.incorrect`
     - `.result-answer`
     - `.card`・`.result-breakdown`（登場アニメーション含む）
     - `.rp-section-label`
     - `.yaku-list` / `.yaku-list li` / `li > span:first-child` / `li > span:last-child`
     - `.calculation-line`
     - `.fu-list li` / `.fu-note`（非 `--primary` 版）
     - `.result-alt` / `h2` / `.rp-alt-icon` / `p`
     - `prefers-reduced-motion` によるアニメーション無効化ブロック
   - `.rp-detail-toggle` に `.quiz-page` スコープの軽微な上書き（`color: var(--fl-teal-dark)` 等）を
     新規追加する。
2. **目視確認**: `/quiz` で正解時・不正解時それぞれ回答し、判定カード・答え・内訳カード・
   （不正解時は自動展開される）高点法別解が `/fu/result` と同系統のFlip7装飾で表示されることを
   確認する。「解説はこちら」トグルの開閉も確認する。

### 受け入れ基準

- 点数計算モード（`/quiz`）の回答後、正誤表示が判定カード（正解=ティール系／不正解=コーラル系の
  色付き枠＋グロー影）として表示される。
- 答えがゴールドピルで表示される。
- 内訳カード・高点法別解カードが符計算モードの解説画面と同系統のFlip7装飾（テイール枠・グロー影等）
  になる。
- 「解説はこちら」トグルが周囲のカードと違和感なく馴染む見た目になっている。
- `ResultPage.tsx`（`/result`）・`FuResultPage.tsx`（`/fu/result`）の表示に変更がない（回帰）。
- 符計算モードの `ChoiceGrid`・出題部分など、判定カード以外の表示に変更がない。
- `npm test` / `npm run lint` が通る。
