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

## アーキテクチャ移行（T-019〜T-025）— 背景

bulletproof-react＋オニオンアーキテクチャでDDDを実現するためのフォルダ構成移行群。
確定した設計判断・全体方針・依存ルールは **`ARCHITECTURE.md`を正典**とする（`/grill-plan`セッションで合意済み）。
以下は各タスクの要点のみ。詳細な理由・全体構成図はARCHITECTURE.mdを参照。

**依存関係**: T-019（土台）→ T-020（設定パイロット）→ T-021（共有UI）→ T-022（記事）→ T-023（出題+成績、最大）→ T-024（app/新設）→ T-025（後片付け）。原則この順で進める。

---

## T-019 開発基盤整備（パスエイリアス・ESLint境界ルール）（完了）

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

## T-020 `features/settings` 移行（パイロット）（完了）

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

## T-021 `shared/` 新設（共有UIの抽出）（完了）

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

## T-022 `features/articles` 移行（完了）

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

## T-023 `features/practice` 移行（出題＋成績統合）（完了）

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

## T-024 `app/` 新設（ルーティング・静的ページ・画面組み立て）（完了）

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
