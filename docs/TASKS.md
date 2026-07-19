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

## T-018 設定画面のTailwind移行（完了）

### 目的

`docs/STYLE-TRANSFER.md`の移行方式（T-014〜T-017の前例）を**設定画面**（`SettingsPage.tsx`・`settings.css`）に適用する。
詳細な設計判断は **SPEC.md §8.3.5** を正典とする（`/grilling`セッションで合意済み）。

### 確定した設計判断（要点。詳細はSPEC.md §8.3.5）

- `page-shell`はクラス名ごと残す（他ファイルと共有）。`page-header`・`page-header-link`・`page-header-link-item`・`card`はCSSルールを削除せず、`SettingsPage.tsx`側のみクラス名の使用をやめてTailwindユーティリティで再現する。
- `settings.css`のそれ以外の全ルールは他ファイルと共有していないため全面削除する。
- ヘッダーは`AboutPage.tsx`等（T-017）と同一のTailwindユーティリティ文字列を流用し、見出しテキストのみ「設定」に変更する。
- トグルスイッチのカスタム外観（appearance:none・radial-gradientのつまみ・`:checked`スライド）はCSS残置せず、`checked:`バリアント＋任意値プロパティで完全にTailwind化する。
- `.settings-page`の`gap: 24px`はベース`.page-shell`の`gap: var(--space-5)`（=24px）と同値のため宣言ごと削除する。
- 未使用トークン（`--fl-gold`系・`--fl-coral`・`--fl-r-md`・`--fl-glow-teal`（非soft））を削除する。
- 色トークン（`--fl-teal`系・`--fl-cream`・`--fl-surface`・`--fl-card`・`--fl-ink`・`--fl-body`・`--fl-muted`）は`@theme`に登録済みのため、ページローカル定義を削除しネイティブユーティリティで参照する。
- 残すのは色以外の未昇格トークン（`--fl-r-lg`・`--fl-r-pill`・`--fl-glow-teal-soft`・`--fl-bounce`・`--fl-dur`）・`@keyframes settings-rise`・`.settings-page`の背景グラデーションのみ。
- `SettingsPage.test.tsx`は既にrole/表示テキストベースのクエリのみのため変更不要。

### 影響ファイル

- `src/components/SettingsPage.tsx` — 構造をTailwindユーティリティで再実装
- `src/components/settings.css` — 構造・レイアウトルールを全面削除し、残置CSS（トークン・keyframes・背景グラデーション）のみ残す

### 実装ステップ

1. `SettingsPage.tsx`のヘッダーを`AboutPage.tsx`等と同一のTailwindユーティリティ文字列で置き換える（見出しテキストのみ「設定」）。
2. トグル項目のカード（`section.card.settings-item`）・トグル行・トグルスイッチ本体をTailwindユーティリティで再実装する（`checked:`バリアント含む）。
3. `settings.css`から構造・レイアウトルール、未使用トークン（`--fl-gold`系・`--fl-coral`・`--fl-r-md`・`--fl-glow-teal`）、`gap`宣言、色トークン定義を削除し、残置CSS（半径・グロー影・イージング・keyframes・背景グラデーション）のみ残す。
4. `prefers-reduced-motion`のCSSブロックを削除し、`motion-reduce:`バリアントに置き換える。
5. ブラウザ目視（スマホ幅375px・PC幅）でピクセルレベルの一致を確認する。

### 受け入れ基準

- SPEC.md §8.3.5の受け入れ基準を満たす。
- `npm test` / `npm run lint` が通る。

---

## アーキテクチャ移行（T-019〜T-025）— 背景

bulletproof-react＋オニオンアーキテクチャでDDDを実現するためのフォルダ構成移行群。
確定した設計判断・全体方針・依存ルールは **`ARCHITECTURE.md`を正典**とする（`/grill-plan`セッションで合意済み）。
以下は各タスクの要点のみ。詳細な理由・全体構成図はARCHITECTURE.mdを参照。

**依存関係**: T-019（土台）→ T-020（設定パイロット）→ T-021（共有UI）→ T-022（記事）→ T-023（出題+成績、最大）→ T-024（app/新設）→ T-025（後片付け）。原則この順で進める。

---

## T-019 開発基盤整備（パスエイリアス・ESLint境界ルール）

### 目的

移行の土台として、パスエイリアスと依存方向を強制するESLintルールを先に用意する。以降のタスクはこの上で進める。

### 確定した設計判断（詳細はARCHITECTURE.md A6・A7・A8）

- `tsconfig`の`paths`＋Viteの`resolve.alias`で `@/engine`・`@/features/*`・`@/shared`・`@/app` を導入する。既存の相対importは変更しない（共存）。
- ESLintに`no-restricted-imports`ベースの境界ルールを追加するが、**適用範囲は新設フォルダのみ**（`engine/features/shared/app`）。旧`components/store/content/data/settings`直下は除外パターンで対象外にする。
- `features/practice → features/settings`の1件だけを明示的な例外として許可し、コメントで理由を明記する。

### 影響ファイル

- `tsconfig.app.json`（`paths`追加）
- `vite.config.ts`（`resolve.alias`追加）
- `eslint.config.js`（境界ルール追加、除外パターン込み）

### 受け入れ基準

- 新設エイリアスでのimportが型解決・ビルドともに通る。
- 既存の相対importを含め`npm run build` / `npm test` / `npm run lint`が通る（既存コードへの影響なし）。
- 意図的に`engine`→`features`のような逆方向importを書くとESLintがエラーにする（動作確認後、確認用コードは削除する）。

---

## T-020 `features/settings` 移行（パイロット）

### 目的

最も目標構成に近い`settings/`を先行移行し、フォルダ構成・層分割・ESLintルール・エイリアスの型を実証する。

### 確定した設計判断（詳細はARCHITECTURE.md A5）

- `appSettings.ts`（`AppSettings`・`parseSettings`等）→ `features/settings/domain/`
- `settingsRepository.ts`（`SettingsRepository`インターフェース）→ `features/settings/application/`
- `indexedDbSettingsRepository.ts`・`settingsRepository.instance.ts`（合成ルート）→ `features/settings/infrastructure/`
- `SettingsContext.tsx` → `features/settings/presentation/`
- `src/components/SettingsPage.tsx`・`SettingsPage.test.tsx` → `features/settings/presentation/`
- 他featureからは`features/settings/presentation`の公開hook（`useSettings`等）経由でのみ参照させる。

### 影響ファイル

- `src/settings/*` 一式（移動）
- `src/components/SettingsPage.tsx`・`SettingsPage.test.tsx`（移動）
- `src/App.tsx`・`src/components/QuizPage.tsx`・`ConvertQuizPage.tsx`（import先変更のみ、ロジック不変）

### 受け入れ基準

- 移動後も設定画面・切り上げ満貫トグルの挙動が変わらない（回帰なし）。
- `features/settings`配下がT-019のESLintルール適用対象に追加され、違反なく通る。
- `npm test` / `npm run lint` / `npm run build`が通る。

---

## T-021 `shared/` 新設（共有UIの抽出）

### 目的

`features/practice`と`features/articles`の両方から使われる牌描画UIを、featureに属さない共有層へ切り出す。

### 確定した設計判断（詳細はARCHITECTURE.md A3・A4）

- `TileFace`・`MeldGroup`・`TileRow`・`HandDisplay`・`tileAssets.ts`・`ChoiceGrid`・`PageHeader`・`SidebarPageHeader`・`Footer`・`Sidebar`・`ErrorBoundary`・`ScrollTop`・`ScoreTableDialog`を`shared/`へ移動する。
- ロジック・マークアップは変更しない（移動のみ）。

### 影響ファイル

- `src/components/tiles/*`・`ChoiceGrid.tsx`・`PageHeader.tsx`・`SidebarPageHeader.tsx`・`Footer.tsx`・`Sidebar.tsx`・`ErrorBoundary.tsx`・`ScrollTop.tsx`・`ScoreTableDialog.tsx`（移動）
- これらをimportする既存コンポーネント（import先変更のみ）

### 受け入れ基準

- 全画面の見た目・挙動に変化がない（回帰なし）。
- `npm test` / `npm run lint` / `npm run build`が通る。

---

## T-022 `features/articles` 移行

### 目的

記事機能を新構成へ移行する。T-021で共有化した牌描画UIに依存する形にする。

### 確定した設計判断

- `content/articles/registry.ts`（`ArticleMeta`/`Article`）→ `features/articles/domain/`
- `content/articles/handNotation.ts`（`ParsedHand`）→ `features/articles/domain/`（または`application/`。手牌記法のパースはドメイン変換に近いため`domain/`を優先）
- Markdown本文の読み込み → `features/articles/infrastructure/`
- `ArticleListPage.tsx`・`ArticlePage.tsx`・`ArticleHand.tsx`・`ArticleMarkdown.tsx` → `features/articles/presentation/`（`ArticleHand`は`shared/`の`TileRow`をimportする）

### 影響ファイル

- `src/content/articles/*`（移動）
- `src/components/ArticleListPage.tsx`・`ArticlePage.tsx`・`articles/ArticleHand.tsx`・`articles/ArticleMarkdown.tsx`とそれぞれのテスト（移動）

### 受け入れ基準

- 記事一覧・記事詳細・記事内の手牌表示が移行前と同じ見た目・挙動。
- `npm test` / `npm run lint` / `npm run build`が通る。

---

## T-023 `features/practice` 移行（出題＋成績統合）

### 目的

最大かつ最高リスクの移行。②出題（4モード）と③成績・復習を`features/practice`1つに統合する（ARCHITECTURE.md A3で確定した通り、独立feature化しない）。

### 確定した設計判断（詳細はARCHITECTURE.md A3・A5・A6）

- `data/problem.ts`（`Problem`/`ProblemConditions`/`ProblemTags`）・`data/problemBank.json` → `features/practice/domain/`・`features/practice/infrastructure/`（バンクJSON読み込み）
- `generator/*`（`generateProblem`・`distractors`・`conversion`・`randomHand`・`random`） → `features/practice/application/`
- `store/nextProblem.ts`・`store/statsStore.ts`・`store/weighting.ts` → `features/practice/application/`（③統合）。`statsStore`のlocalStorage読み書き部分は`infrastructure/`に切り出す。
- `QuizPage`・`FuQuizPage`・`FuPartsQuizPage`・`ConvertQuizPage`・`ResultPage`・`FuResultPage`・`ResultContent`・`StatsPage`・`FuBreakdown`・`QuizConditions`・`QuizTileHeader` → `features/practice/presentation/`
- `features/practice`から`features/settings`への直接importは、T-019で許可した唯一の例外として扱う（切り上げ満貫設定の読み取り）。

### 影響ファイル

- `src/generator/*`・`src/store/*`・`src/data/*`（移動）
- `src/components/Quiz*.tsx`・`Fu*.tsx`・`Convert*.tsx`・`Result*.tsx`・`StatsPage.tsx`とそれぞれのテスト（移動）
- `scripts/buildProblemBank.ts`（バンクJSON生成元。参照パス変更）

### 受け入れ基準

- 4モード（最終点数・符計算・符分解・点数換算）の出題・採点・解説・成績記録・苦手復習の重み付けが移行前と完全に一致する（回帰なし）。
- `npm run test:e2e`（quiz-flow.spec.ts）が通る。
- `npm test` / `npm run lint` / `npm run build`が通る。

---

## T-024 `app/` 新設（ルーティング・静的ページ・画面組み立て）

### 目的

ドメインロジックを持たない静的ページとルーティング・出題モード定義を`app/`に集約し、`features/`の純度を保つ。

### 確定した設計判断（詳細はARCHITECTURE.md A3）

- `src/App.tsx` → `app/`（ルーティング定義。各featureの`presentation/`をimportして配線するのみ）
- `HomePage.tsx`・`AboutPage.tsx`・`ContactPage.tsx`・`PrivacyPolicyPage.tsx` → `app/`
- `config/modes.ts`（`ModeId`/`ModeDef`） → `app/`

### 影響ファイル

- `src/App.tsx`・`src/components/HomePage.tsx`・`AboutPage.tsx`・`ContactPage.tsx`・`PrivacyPolicyPage.tsx`・`src/config/modes.ts`（移動）
- `src/main.tsx`（import先変更のみ）

### 受け入れ基準

- 全ルートのページ遷移・表示が移行前と同じ。
- `npm test` / `npm run lint` / `npm run build`が通る。

---

## T-025 旧ディレクトリ整理・ドキュメント更新

### 目的

移行完了後、旧トップレベルディレクトリを削除し、ESLint境界ルールの除外パターンを解除、`CLAUDE.md`のディレクトリ構成記述を更新する。

### 確定した設計判断

- 空になった`src/components/`（フラット構成）・`src/store/`・`src/content/`・`src/data/`・`src/settings/`・`src/config/`を削除する。
- T-019で設けたESLint除外パターンを解除し、境界ルールをリポジトリ全体に適用する。
- `CLAUDE.md`の「ディレクトリ構成」節を新構成（`engine/features/shared/app`）に書き換える。

### 影響ファイル

- 上記の旧ディレクトリ（削除）
- `eslint.config.js`（除外パターン解除）
- `CLAUDE.md`（ディレクトリ構成節）

### 受け入れ基準

- 旧ディレクトリが存在しない。
- ESLint境界ルールが例外（`practice→settings`の1件）を除き全域で有効。
- `npm test` / `npm run lint` / `npm run build`が通る。

---
