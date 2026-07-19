# TASKS.md — 実装計画

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

## T-008 モメンタムカウンタ（スループット主・ストリーク脇・非懲罰）（完了）

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

## T-012 点数計算モードの正誤ラベルをスマホ幅で縮小（完了／T-013で置き換え）

**注記**: 本タスクが追加した`.quiz-page .result-verdict`のスマホ幅縮小ルールは、T-013で
`QuizPage`が独立した判定カード（`.result-verdict-row`）自体を描画しなくなるため、T-013にて
削除する（`ConvertQuizPage`は同値のより詳細なセレクタを別途持つため影響なし）。

### 目的 / 変更内容

点数計算モード（`QuizPage.tsx`）のインライン結果にある正誤ラベル（`○ 正解`／`✕ 不正解`。マークと
文字は同一要素の1文字列）は、既定サイズ（`--fs-score`＝2.2rem）のままスマホ幅でも表示されており、
狭い画面では答えのピル（`.result-answer`）と1行に収まらず折り返ることがある（実機375px幅で確認済み）。
点数換算モード（`ConvertQuizPage`）は既に `.convert-flashcard-result .result-verdict` に対して
同様の縮小（1.3rem）をスマホ幅で適用済みであり、同じ考え方を点数計算モードにも導入する。
（正典: SPEC.md §4.4「正誤ラベルのスマホ幅縮小（点数計算モード）」）

### 確定した設計判断

- **対象はラベル要素（`.result-verdict`）のみ**: 答えのピル（`.result-answer`）・計算式は今回は
  対象外とする（点数換算モードのように答えピル・計算式まで併せて縮小することはしない）。
  折り返しが完全には解消しない場合があることは許容する。
- **ブレークポイント**: 既存の `--bp-sm`（640px未満）を使う（`convert.css`・`quiz.css` と同じ規約）。
- **縮小後のサイズ**: `1.3rem`（`convert.css` の `.convert-flashcard-result .result-verdict` と
  同じ値。アプリ全体での「スマホ幅の正誤ラベルサイズ」の基準を揃える）。
- **スコープ**: 点数計算モード（`.quiz-page`）のインライン結果のみ。`ResultPage.tsx`（`/result`）・
  `FuResultPage.tsx`（`/fu/result`）・符計算モードは対象外（T-009/T-010 と同じ境界）。

### 影響ファイル

- `src/components/quizFlip7.css` — `.quiz-page .result-verdict` のスマホ幅（`--bp-sm`）向け
  `font-size` 上書きを追加

### 実装ステップ

1. **`quizFlip7.css`**: 新規に `@media (--bp-sm) { .quiz-page .result-verdict { font-size: 1.3rem; } }`
   を追加する。
2. **目視確認**: ブラウザ幅を375px程度に縮小し、`/quiz` で不正解（ラベルが長い「✕ 不正解」）を出し、
   正誤ラベルと答えのピルの折り返し状況を確認する（完全な1行化は必須要件ではない）。640px以上では
   従来どおり `--fs-score`（2.2rem）のままであることも確認する。

### 受け入れ基準

- スマホ幅（640px未満）で、点数計算モードの正誤ラベル（`.result-verdict`）が `1.3rem` で表示される。
- PC幅（640px以上）では正誤ラベルのサイズが従来どおり（`--fs-score`＝2.2rem）のまま変わらない。
- 答えのピル・計算式のサイズに変更がない。
- `ResultPage.tsx`（`/result`）・`FuResultPage.tsx`（`/fu/result`）・符計算モードの表示に変更がない（回帰）。
- `npm test` / `npm run lint` が通る。

---

## T-013 点数計算モード: 正誤・答えを「内訳」ラベル行に統合し、判定カードを廃止（完了）

### 目的 / 変更内容

点数計算モード（`QuizPage`のインライン結果／`ResultPage`解説画面が共有する`ResultContent.tsx`）が
表示していた、独立の「判定カード」（正解=ティール系／不正解=コーラル系の色付き枠＋グロー影＋登場
アニメーション、ゴールドピルの答え表示）を廃止し、代わりに「内訳」カードの**見出し行**に正誤＋正解
点数を統合して表示する（「内訳」ラベルの右に「○ 正解　答え: 8000」のように両端揃えで並べる）。
（正典: SPEC.md §4.4）

対象は点数計算モード（最終点数モード）のみ。符計算モードの解説画面（`FuResultPage.tsx`、
「符の内訳」ラベル・独立実装）・点数換算モード（`ConvertQuizPage.tsx`）は変更しない。

### 確定した設計判断

`/grilling`セッションでの確認結果:

- **対象範囲**: `ResultContent.tsx`（`QuizPage`のインライン結果・`ResultPage`解説画面が共有）のみ。
  `FuResultPage.tsx`・`ConvertQuizPage.tsx`は対象外、現状の判定カード表示を維持する。
- **不正解時の文言**: 「✕ 不正解　答え: 8000」のように、**正誤に関わらず常に正解の点数**
  （`answer.payment`）を表示する（ユーザーの選択値は表示しない。既存仕様を踏襲）。
- **記号・表記の踏襲**: ○/✕マーク・「答え: 」の半角コロン+半角スペースなど、既存の全画面共通の
  表記規則をそのまま使う（新規に表記ルールを作らない）。
- **見た目の強弱**: 判定カード固有の装飾（テイール/コーラルの背景色・枠・グロー影・登場アニメーション
  `rp-pop`）は廃止する。正誤＋答えは「内訳」見出し行の**テキストとして降格**し、正解=緑
  （`--color-success-text`）／不正解=赤（`--color-danger-text`。既存の`.result-verdict.correct`/
  `.incorrect`と同じトークン）の文字色のみで区別する。内訳カード自体（`.card.result-breakdown`）の
  枠・背景色は正誤によらず一定にする。
- **答えの数値の文字スタイル**: 数字専用フォント（`--font-numeric`）・`tabular-nums`・太字は維持し、
  フォントサイズのみ見出し行にふさわしいサイズへ縮小する（`--fs-score`の最強調から降格）。
- **行内配置**: 見出し行はflexboxで両端揃え（`justify-content: space-between`）。左に「内訳」
  ラベル、右に正誤＋答え。
- **折りたたみとの関係**（`QuizPage`のインライン結果。`collapsible`時のみ該当）:
  「内訳」ラベル＋正誤＋答えの見出し行は、「解説はこちら」トグルの**開閉状態に関わらず常時表示**する
  （現行の「畳んでいても正誤・答えだけは見える」体験を維持）。トグルで開閉するのは**役の一覧・計算式**
  （および「内訳」カードの外にある高点法の別解セクション）のみとする。見出し行と開閉コンテンツは
  **同一のカード枠内**にまとめる（カードの枠自体は常時表示、中身だけアコーディオンで開閉）。
  `ResultPage`（`collapsible=false`）では従来どおりすべて常時展開のまま変わらない。
- **既存の関連ルールの後始末**: `quizFlip7.css`の`.quiz-page .result-verdict`に対する
  スマホ幅（`--bp-sm`）縮小ルール（T-012で追加）は、`QuizPage`が`.result-verdict`要素を
  描画しなくなるため**死んだCSSになる**。`ConvertQuizPage`（`page-shell quiz-page convert-page`）は
  `convert.css`に同値（`1.3rem`）のより詳細なセレクタ（`.convert-flashcard-result .result-verdict`）
  を既に持っており、このルールに依存していないため、削除しても`ConvertQuizPage`の見た目に影響しない。
  SPEC.md §4.4の該当記述もあわせて更新済み（本セッションで反映）。
  なお`.quiz-page .result-verdict-row`本体の装飾ルール（背景・枠・グロー・アニメーション）は
  `ConvertQuizPage`が引き続き使用するため**削除しない**（用途が「点数換算モード専用」に変わる
  ことをコメントで明記する）。同様に`.result-page .result-verdict-row`（`resultFlip7.css`）は
  `FuResultPage.tsx`が引き続き使うため削除しない。

### 影響ファイル

- `src/components/ResultContent.tsx` — 構造変更（見出し行を常時表示部として切り出し、
  役一覧・計算式のみ折りたたみ対象にする。旧`.result-verdict-row`ブロックの描画を削除）
- `src/components/result.css` — 見出し行（ラベル＋正誤＋答え）のレイアウト・タイポグラフィ追加
- `src/components/quizFlip7.css` — T-012のスマホ幅縮小ルールを削除。`.quiz-page
.result-verdict-row`等のコメントを「点数換算モード専用」に更新
- `src/components/resultFlip7.css` — コメントの要否確認（`FuResultPage.tsx`専用である旨を明記）
- `src/components/QuizPage.test.tsx` / `src/components/ResultPage.test.tsx` — 正誤・答えの
  表示場所（内訳見出し行内）・折りたたみ時の常時表示を検証するようテストを更新

### 実装ステップ

1. **`ResultContent.tsx`**: `<section className="card result-breakdown">`内の構造を、
   常時表示の見出し行（`内訳`ラベル＋正誤＋答え）と、`expanded`時のみ表示する残り
   （符内訳・役一覧・計算式）に分割する。`collapsible=false`（`ResultPage`）では
   見出し行も残りも常に表示されたままにする（挙動は変えない）。
2. **見出し行のマークアップ**: 「内訳」ラベル（既存の`rp-section-label`）と、正誤
   （`○ 正解`/`✕ 不正解`。既存の`.result-verdict`のクラス・色分けを流用してよい）＋
   「答え: {formatPayment(...)}」を1つのflex行にまとめ、`justify-content: space-between`
   で両端に配置する。
3. **旧`.result-verdict-row`ブロックを削除**: `ResultContent.tsx`から独立した判定カード
   （`<div className="result-verdict-row">...`）の描画を削除する。
4. **CSS**: 新しい見出し行用のクラスを`result.css`に追加（レイアウト・フォントサイズ・色分け）。
   `quizFlip7.css`のT-012追加分（`.quiz-page .result-verdict`のスマホ幅縮小）を削除。
   `.quiz-page .result-verdict-row`等、判定カード装飾ルール自体は`ConvertQuizPage`が
   引き続き使うため残すが、コメントを更新して用途の誤解を防ぐ。
5. **テスト更新**: `QuizPage.test.tsx`・`ResultPage.test.tsx`で、正誤・答えのテキストが
   「内訳」見出し行の中にあることを検証する。折りたたみ（正解時デフォルト畳み）の状態でも
   正誤・答えが表示されたままであること、役一覧・計算式は畳まれて非表示であることを検証する。

### 受け入れ基準

- 点数計算モード（`QuizPage`インライン結果・`ResultPage`解説画面）で、「内訳」ラベルの右に
  「○ 正解　答え: 8000」（または「✕ 不正解　答え: 8000」）が1行で表示される。
- 独立した判定カード（テイール/コーラルの背景・グロー・アニメーション付きブロック）が
  もう表示されない。
- 不正解時も常に**正解の点数**が表示される（ユーザーの選択値ではない）。
- 正解時、デフォルトで解説が畳まれていても「内訳＋正誤＋答え」は見える。役一覧・計算式は
  「解説はこちら」を開くまで見えない。
- 不正解時は従来どおり解説がデフォルトで展開されている。
- 符計算モードの解説画面（`/fu/result`）・点数換算モード（`/convert`）の表示に変更がない（回帰）。
- `npm test` / `npm run lint` が通る。

---

## T-014 スタイル適用方式のTailwind移行（点数計算モード先行）（完了）

**実装時の追記**: 計画段階（グリリング）では `.qp-board`・`.quiz-skip`/`.qp-skip-btn`・
`.calculation-line`・`.qp-table-header-btn` を「QuizPage/ResultContent専用」としていたが、
実装時に全ファイル横断でgrepした結果、実際には `FuQuizPage.tsx`（`.qp-board`・`.qp-skip-btn`）・
`ConvertQuizPage.tsx`（`.qp-skip-btn`・`.calculation-line`・`.qp-table-header-btn`）とも
共有していたことが判明した。既存ルール（共有クラスはCSS温存・対象ファイル側のみTailwind化）を
そのまま適用して対応し、ユーザーに確認のうえ予定通り全要素をTailwind化した（CSS削除なし）。
下記「影響ファイル」「実装ステップ」はこの実態に合わせて更新済み。

### 目的

スタイル適用方式をプレーンCSS（CSSカスタムプロパティ＋ページスコープの子孫セレクタ）からTailwind CSSへ段階移行する。
全画面一括ではなく**点数計算モード**（`QuizPage.tsx`・`ResultContent.tsx`・`ResultPage.tsx`）を最初の対象とし、
他モード（符計算・符分解・点数換算・ホーム等）の見た目への影響ゼロを維持する（`/grilling`セッションでの合意事項。
正典: SPEC.md §8.3.1）。

### 確定した設計判断

`/grilling`セッションでの確認結果（詳細・理由はSPEC.md §8.3.1）:

- **Tailwind v4**（CSS-first。`tailwind.config.js`は使わない）を導入する。
- **Preflightは導入しない**（`tailwindcss/theme`・`tailwindcss/utilities`のみ読み込む）。対象外画面への見た目の影響をゼロにするため。
- **対象範囲の判定ルール**: `QuizPage.tsx`・`ResultContent.tsx`・`ResultPage.tsx`自身が直接描画する要素のみをTailwind化する。
  共有コンポーネント（`ChoiceGrid`・`QuizConditions`・`SidebarPageHeader`・`FuBreakdownContent`・`QuizTileHeader`・
  `HandDisplay`・`ScoreTableDialog`）自体、およびそれらの汎用クラスを`.quiz-page`/`.result-page`子孫セレクタで
  上書きしている既存CSSは一切変更しない。
- **`FuResultPage.tsx`と共有するクラス**（`.card`・`.result-breakdown`（基底）・`.result-actions`・`.btn-primary`・
  `.btn-secondary`・`.rp-cta-arrow`）は、既存CSSルールを削除せず残す。`ResultContent.tsx`/`ResultPage.tsx`側だけ
  使用をやめ、Tailwindユーティリティで同じ見た目を再現する（FuResultPageは今回一切変更しない）。
- **デザイントークン**: `src/index.css`の既存トークン（`--color-*`・`--space-*`・`--fs-*`・`--radius-*`等）は
  Tailwindの`@theme`にマッピングして流用する（値を二重管理しない）。`quizFlip7.css`の`.quiz-page`スコープ内
  Flip7配色（`--fl-teal`等）は`@theme`に昇格させサイト全体のトークンにする。
- **ブレークポイント**: `@theme`の`--breakpoint-*`を既存`--bp-sm`系と同じ値（640px境界）に合わせ、
  Tailwind標準の`sm:`プレフィクスを使う。
- **既存クラス名**: 移行対象要素（`FuResultPage.tsx`と共有するものを除く）の既存クラス名は廃止する。
  依存していたテスト（`QuizPage.test.tsx`）は`role`／表示テキスト／`data-testid`ベースのクエリへ書き換える。

### 影響ファイル

- `package.json` / `package-lock.json` — `tailwindcss@4.3.3`・`@tailwindcss/postcss@4.3.3` を追加
- `postcss.config.js` — Tailwindプラグインを追加（`postcss-custom-media`より後段に置く。理由は下記）
- `src/styles/tailwind.css`（**新規**）— `@import "tailwindcss/theme"`・`@import "tailwindcss/utilities"`
  （`preflight`は読み込まない）と`@theme`でのトークン/Flip7配色/ブレークポイントのマッピング。
  `src/index.css`とは別ファイルに分離し、`src/main.tsx`から独立したモジュールとしてimportする
  （理由: `@tailwindcss/postcss`は`@import "tailwindcss/..."`を含むファイルを自前でファイルシステムから
  読み直して検証するため、同じファイル内にpostcss-custom-media展開前の`@media (--bp-xxx)`が存在すると
  解析エラーになる。postcssプラグインの実行順を変えても解消しなかった）
- `src/main.tsx` — `./styles/tailwind.css`のimportを追加（影響ファイル未記載だった追加。上記の理由による）
- `src/index.css` — 配色・フォントファミリートークンの実体を`@theme`へ移設（`:root`の同名宣言は自己参照に
  なるため削除。既存の`var(--color-accent)`等の参照は`@theme`の`:root`コンパイル出力でそのまま解決する）
- `src/components/QuizPage.tsx` — 対象要素をTailwindユーティリティへ置換
- `src/components/quiz.css` — `.qp-momentum*`（T-008で追加した専用クラス。他ファイルと非共有）のCSSルールを削除
- `src/components/quizFlip7.css` — `.rp-detail-toggle`・`.yaku-list`・`.result-alt`（非共有）のCSSルールを削除。
  `.qp-board`・`.qp-skip-btn`・`.calculation-line`（`FuQuizPage.tsx`/`ConvertQuizPage.tsx`と共有と判明）は
  クラス名・ルールとも維持し、コメントで共有先を明記
- `src/components/scoreTable.css`（影響ファイル未記載だった追加）— `.qp-table-header-btn`
  （`ConvertQuizPage.tsx`と共有と判明）はコメント更新のみ、ルールは維持
- `src/components/ResultContent.tsx` — 対象要素をTailwindユーティリティへ置換
- `src/components/ResultPage.tsx` — 対象要素をTailwindユーティリティへ置換
- `src/components/result.css` / `src/components/resultFlip7.css` — `FuResultPage.tsx`と非共有の要素
  （`.result-breakdown-header`・`.result-breakdown-verdict`・`.result-breakdown-answer`・`.rp-detail-toggle`・
  `.yaku-list`・`.result-alt`・`.rp-alt-icon`、および`.result-page`スコープの`.calculation-line`）のCSSルールを
  削除。共有クラス（`.card`・`.result-breakdown`基底・`.result-actions`・`.btn-primary`・`.btn-secondary`・
  `.rp-cta-arrow`、`.quiz-page`スコープの`.calculation-line`）は残す
- `src/components/QuizPage.test.tsx` — 廃止クラス名に依存するクエリを`role`/テキスト/`data-testid`へ書き換え

### 実装ステップ（実施内容の記録）

1. **Tailwind導入**: `npm install -D tailwindcss @tailwindcss/postcss`。`postcss.config.js`に
   `tailwindcss()`を`postcss-custom-media`より後段で追加。`@import "tailwindcss/..."`は
   `src/styles/tailwind.css`という独立ファイルに置き、`src/main.tsx`から`src/index.css`とは別に
   importした（同一ファイル内に置くとビルドエラーになったため。上記「影響ファイル」参照）。
2. **`@theme`マッピング**: 色・フォントファミリートークンは`src/index.css`の`:root`から
   `src/styles/tailwind.css`の`@theme`へ移設（名前は変更せず、自己参照を避けるため`:root`側の
   同名宣言は削除）。Flip7配色（`--fl-*`）は`--color-fl-*`として`@theme`に複製（`.quiz-page`/`.result-page`
   ローカル定義は既存参照のため残す）。`--breakpoint-sm`を`--bp-sm-up`と同じ640pxに設定。
   spacing/radius/font-sizeは`@theme`へ移さず、Tailwindユーティリティ側で`p-[var(--space-4)]`等の
   任意値記法で既存`:root`トークンを直接参照する方針とした（`--space-*`等の名前がTailwindの命名規約と
   異なり、移設すると全CSSファイルでの参照名変更が必要になるため）。
3. **`QuizPage.tsx`移行**: `.qp-momentum*`・`.qp-board`・`.qp-table-header-btn`・`.quiz-skip`/`.qp-skip-btn`を
   Tailwindユーティリティに置換。共有と判明した`.qp-board`・`.qp-skip-btn`・`.qp-table-header-btn`は
   CSSルールを削除せず、クラス名の使用のみやめた。ブラウザ目視で正解/不正解両状態・スマホ幅・PC幅の
   見た目が移行前と一致することを確認した。
4. **`ResultContent.tsx`移行**: 見出し行・トグル・役一覧・計算式・高点法別解をTailwindユーティリティに置換。
   `.calculation-line`は`ConvertQuizPage.tsx`と共有と判明したためCSSルールを削除せずクラス名のみやめた
   （`.quiz-page`スコープ分は維持、`.result-page`スコープ分は非共有のため削除）。`.card`・`.result-breakdown`
   基底・`.result-actions`・`.btn-primary`/`.btn-secondary`・`.rp-cta-arrow`も同様にクラス名のみやめ、
   CSSルールは`FuResultPage.tsx`のために維持した。
5. **`ResultPage.tsx`移行**: `result-actions`内の`.btn-primary`/`.btn-secondary`インスタンスをTailwindユーティリティに
   置換（`::before`の光沢オーバーレイは`before:`バリアントで再現）。CSSルール自体は残した。
6. **テスト移行**: `QuizPage.test.tsx`で廃止クラス名（`.result-breakdown-body`・`.qp-momentum-primary-value`・
   `.qp-momentum-secondary-value`）に依存するクエリを`data-testid`（`result-breakdown-body`・
   `momentum-today`・`momentum-streak`）へ書き換えた。`.result-breakdown`（共有・維持）・`.quiz-choice-btn`
   （`ChoiceGrid`所有）へのクエリは変更していない。
7. **回帰確認**: `/quiz`・`/fu/quiz`・`/fu/result`・`/convert`・`/`をブラウザで目視し、見た目に変化が
   ないことを確認した（Preflight非導入・共有クラスのCSS温存を確認）。`/fu/parts`は個別確認していない
   （変更ファイルを一切含まないため回帰リスクなしと判断）。`/result`はブラウザでの直接確認手順が
   ないため（`React Router`の`location.state`が必要）、`ResultPage.test.tsx`が無改修のまま全通過することと
   コードレビューで代替した。

### 受け入れ基準

- `npm install`後、`/quiz`・`/result`で見た目が移行前とピクセルレベルで変わらない（配色・余白・角丸・アニメーション含む）。
- 対象要素（モメンタムカウンタ・盤面枠・スキップ操作・内訳見出し行・トグル・役一覧・計算式・高点法別解・
  アクション行）が対応するTailwindユーティリティクラスで実装され、旧クラス名（`FuResultPage.tsx`と共有するものを除く）
  が`QuizPage.tsx`/`ResultContent.tsx`/`ResultPage.tsx`のJSXから消えている。
- `/fu/quiz`・`/fu/result`・`/fu/parts`・`/convert`・`/`の見た目に変化がない（回帰。特に`FuResultPage.tsx`の
  `.card`・`.result-breakdown`・`.result-actions`・ボタンの見た目）。
- Tailwind導入後もPreflightによる全体リセットが適用されていない（対象外要素のマージン・ボタン既定見た目等が不変）。
- `npm test` / `npm run lint` が通る。

---

## T-015 ホーム画面のTailwind移行（完了）

### 目的

T-014で確立したスタイル適用方式（Tailwind CSS v4・Preflight非導入・トークンの`@theme`マッピング）を、**ホーム画面**（`HomePage.tsx`・`home.css`）に適用する。ホームは他画面とクラス名・CSSカスタムプロパティを一切共有していない（`FuResultPage.tsx`等と共有クラスがあった点数計算モードとは条件が異なる）ため、共有クラス温存の例外なく構造・レイアウトのCSSを全面的にTailwindユーティリティへ置き換えられる（正典: SPEC.md §8.3.2）。

### 確定した設計判断

`/grilling`セッションでの確認結果:

- **残置パターンはT-014を踏襲**: 構造・レイアウト（`flex`・`grid`・`padding`・文字サイズ等）はすべてTailwindユーティリティに置き換えて`home.css`から削除する。**色・形状・モーションのトークン**（`--fl-r-*`・`--fl-glow-*`・`--fl-bounce`・`--fl-dur`）・**`@keyframes`**（`home-rise`・`home-pop`）・**`.home-page`の背景グラデーション**は`.home-page`スコープのCSSカスタムプロパティとして`home.css`に残し、JSX側はTailwindの任意値記法（例: `shadow-[var(--fl-glow-teal)]`）から参照する。
- **新規トークンの昇格**: `home.css`にのみ存在する色トークン`--fl-violet`・`--fl-violet-dark`は、`tailwind.css`の`@theme`へ`--color-fl-violet`・`--color-fl-violet-dark`として追加し、`bg-fl-violet`等のネイティブユーティリティとして使えるようにする（T-014でteal/gold/coral等を昇格させたのと同じ扱い）。半径・グロー影・所要時間など色以外の新規トークンは昇格させない。
- **独自ブレークポイント`--bp-home-2col`（480px）**: `@theme`の`--breakpoint-*`へは昇格させず、`min-[480px]:`のようなTailwindの任意値ブレークポイントバリアントをJSX側に直接記述する。他画面で未使用のため`src/styles/breakpoints.css`の定義は削除する。
- **擬似要素の実要素化**: `.home-ribbon::before/::after`（リボン両端の帯）・`.home-mode::before`（モードカード左アクセントバー）は、`before:`/`after:`のTailwind任意値チェーンではなく、`aria-hidden`付きの実`<span>`要素に置き換えてTailwindユーティリティで直接スタイリングする（既存の`.home-hero-fan-card`と同じ手法に統一）。
- **付随する既存瑕疵の解消**: `src/index.css`の`prefers-reduced-motion`ブロックにある、現行`home.css`のどのクラスとも一致しない死んだセレクタ`.home-mode-card`を本タスクであわせて削除する。
- **テスト**: `HomePage.test.tsx`は新規追加しない（スタイルのみの変更のため）。受け入れ確認はブラウザ目視で行う。

### 影響ファイル

- `src/components/HomePage.tsx` — 対象要素をTailwindユーティリティへ置換。擬似要素だった装飾（リボン両端の帯・モードカード左アクセントバー）を`aria-hidden`付き実要素として実装
- `src/components/home.css` — 構造・レイアウト・擬似要素ルール・`@media (--bp-home-2col)`を削除。`.home-page`スコープの色/形状/モーショントークン・`@keyframes`・背景グラデーションのみ残す
- `src/styles/tailwind.css` — `@theme`に`--color-fl-violet`・`--color-fl-violet-dark`を追加
- `src/styles/breakpoints.css` — 未使用になる`--bp-home-2col`の定義を削除
- `src/index.css` — `prefers-reduced-motion`ブロックの死んだセレクタ`.home-mode-card`を削除

### 実装ステップ

1. **`tailwind.css`**: `@theme`に`--color-fl-violet`・`--color-fl-violet-dark`を追加する。
2. **`HomePage.tsx`移行**: トップバー（ブランド・設定ピル）・ヒーロー（ファンカード・リボン・見出し）・練習メニュー（モードカードグリッド）・学習ガイド導線をTailwindユーティリティに置換する。リボンの両端タブ・モードカードの左アクセントバーは`aria-hidden`付きの実`<span>`要素として実装する。
3. **グリッド切り替え**: モードカードグリッドの1列→2列切り替えは`min-[480px]:`の任意値バリアントで実装する。
4. **`home.css`の縮小**: 構造・レイアウト・擬似要素・`@media (--bp-home-2col)`ルールを削除し、`.home-page`スコープの色/形状/モーショントークン・`@keyframes`（`home-rise`・`home-pop`）・背景グラデーションのみを残す。
5. **`breakpoints.css`**: 未使用になった`--bp-home-2col`を削除する。
6. **`index.css`**: 死んだセレクタ`.home-mode-card`を削除する。
7. **回帰確認**: ブラウザで`/`をスマホ幅（375px程度）・PC幅の両方、通常表示・hover/active・`prefers-reduced-motion`設定時の3状態で目視確認する。480px前後のグリッド列切り替えも確認する。`/quiz`等の他画面に新規トークン追加による回帰がないことも確認する。

### 受け入れ基準

- `npm install`後、`/`の見た目が移行前とピクセルレベルで変わらない（配色・余白・角丸・アニメーション含む）。スマホ幅・PC幅の両方で確認する。
- モードカード・ピルボタン・リボン・ファンカードの`hover`/`active`状態が移行前と一致する。
- `prefers-reduced-motion`設定時、登場アニメーション・hover移動が無効化される（移行前と同じ挙動）。
- 480px前後でのモードカードグリッドの1列⇄2列切り替えが移行前と一致する。
- `home.css`から構造・レイアウト・擬似要素・独自ブレークポイントのCSSルールが消え、`.home-page`スコープのトークン定義・`@keyframes`・背景グラデーションのみが残る。
- 他画面（`/quiz`等）の見た目に変化がない（新規昇格トークンの追加による回帰がないこと）。
- `npm test` / `npm run lint` が通る。
