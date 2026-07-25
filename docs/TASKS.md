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

## T-025 旧ディレクトリ整理・ドキュメント更新（完了）

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

## アーキテクチャ移行フォローアップ（T-026）— 背景

T-019〜T-025完了後、より一般的なbulletproof-react構成（`components/hooks/lib/config/stores/testing/types/utils`等）への
将来的な追随を見据えた`/grill-plan`セッションで、コア・ドメイン層の命名を再検討した。ARCHITECTURE.md A8が当初「`engine/`は
リネームしない」としていた判断を撤回し、`core-domain/`へ改称する（詳細はARCHITECTURE.md A8参照）。今回のスコープは
この改称のみで、他のトップレベルフォルダ新設は対象外（将来別セッションで検討）。

---

## T-026 `core-domain/` 命名変更（旧`engine/`）（完了）

### 目的

コア・ドメイン層`engine/`を、複数feature（`practice`・`articles`）から依存される共有カーネルであることがフォルダ名から
直接読み取れるよう`core-domain/`へ改称する。

### 確定した設計判断（詳細はARCHITECTURE.md A8）

- `src/engine/` → `src/core-domain/`にディレクトリごと移動する。内部20ファイルの構成・ファイル名は変更しない
  （フラットなまま、テスト`*.test.ts`も同居のまま）。
- パスエイリアスは`tsconfig`の`"@/*": ["./src/*"]`という単一ワイルドカードのみで、フォルダ移動だけで
  `@/core-domain/*`が自動的に解決される。`tsconfig.app.json`・`vite.config.ts`の変更は不要。
- 既存import 56箇所（`@/engine/...`）をすべて`@/core-domain/...`へ置換する。
- `eslint.config.js`の`files: ["src/engine/**/*.{ts,tsx}"]`パターンと、対応するエラーメッセージ文言を
  `core-domain`に合わせて更新する。

### 影響ファイル

- `src/engine/*`（ディレクトリごと`src/core-domain/`へ移動）
- `@/engine/...`をimportする全ファイル（56箇所、`features/*`・`app/*`・`shared/*`にまたがる）
- `eslint.config.js`（パスパターン・メッセージ更新）
- `CLAUDE.md`のディレクトリ構成節（更新済み）

### 受け入れ基準

- `src/engine/`が存在せず、`src/core-domain/`に20ファイルすべてが移動している。
- リポジトリ内に`@/engine`への参照が残っていない。
- `npm test` / `npm run lint` / `npm run build`が通る（回帰なし）。
- 意図的に`features/*`等から`core-domain`への逆方向import（`core-domain`→`features`）を書くとESLintがエラーにする
  （動作確認後、確認用コードは削除する）。

---

## T-027 `core/scoring/domain/` への再編（Entity/VOとドメインサービスの可読性向上）（完了）

### 目的

T-026で`core-domain/`に移した採点コアが、20ファイルフラットで「どれがEntity/VOで、どれがドメインサービスか」
ファイル名から読み取れない問題を解消する。`/grill-plan`セッションで、`features/*`と同じ`domain/`・`application/`の
語彙を共有カーネルにも適用する方針に合意した（詳細はARCHITECTURE.md A8参照）。

### 確定した設計判断（詳細はARCHITECTURE.md A8）

- トップレベルを`core-domain/` → `core/`に改称し、直下に集約名`scoring/`を挟み、その下に`domain/`を置く
  （`core/scoring/domain/`）。`application/`はポートを伴うユースケースが必要になるまで作らない（現状は不要）。
- Entity/VOはsuffixなしで概念名そのものをファイル名にする。旧`model.ts`を3分割する:
  - `tile.ts`（`Suit`/`Tile`/`HONOR_NAMES`/`SUIT_LABELS`。旧`tileType.ts`・`tiles.ts`の内容もここに統合。
    Tileの検証・比較・整形・分類はTile自身の振る舞いであり、他オブジェクトを横断しないためドメインサービスと区別する）
  - `meld.ts`（`MeldType`/`Meld`）
  - `matchContext.ts`（`Wind`/`WinType`/`WIND_TO_HONOR_RANK`）
- ドメインサービスは`<概念>Service.ts`にリネームする:
  `decompose.ts→decomposeService.ts`／`interpretation.ts→interpretationService.ts`／`yaku.ts→yakuService.ts`／
  `yakuman.ts→yakumanService.ts`／`fu.ts→fuService.ts`／`dora.ts→doraService.ts`／`score.ts→scoreService.ts`／
  `scoreHand.ts→scoreHandService.ts`。
- `scoreHandService.ts`は他8つのドメインサービスを呼び出すが、feature固有の型もI/Oも参照しないため、
  application層ではなくドメインサービスのまま扱う（application層へは移さない）。
- テストファイルはソースと同名にリネームする。`tileType.test.ts`・`tiles.test.ts`は`tile.test.ts`に統合する。
  `yakuCatalogue.test.ts`は対応する同名ソースファイルを持たない独立した回帰テストのため、リネーム対象外とする。
- 内部・外部を問わず、`core-domain`配下への全import（`@/core-domain/...`および相対import）を新パスに置き換える。
- `eslint.config.js`の`files: ["src/core-domain/**/*.{ts,tsx}"]`パターンと、対応するエラーメッセージ文言を
  `core/scoring/domain`に合わせて更新する。

### 影響ファイル

- `src/core-domain/*`（`src/core/scoring/domain/`へ再編。分割・統合・リネームを伴う）
- `@/core-domain/...`をimportする全ファイル（`features/*`・`app/*`・`shared/*`・`scripts/buildProblemBank.ts`）
- `eslint.config.js`（パスパターン・メッセージ更新）
- `CLAUDE.md`のディレクトリ構成節（更新済み）

### 受け入れ基準

- `src/core-domain/`が存在せず、`src/core/scoring/domain/`に再編後の全ファイルが揃っている
  （`tile.ts`・`meld.ts`・`matchContext.ts`＋8本の`*Service.ts`＋対応する`*.test.ts`＋`yakuCatalogue.test.ts`）。
- リポジトリ内に`@/core-domain`・`src/core-domain`への参照が残っていない。
- `npm test` / `npm run lint` / `npm run build`が通る（回帰なし）。
- 意図的に`features/*`等から`core/scoring/domain`への逆方向importを書くとESLintがエラーにする
  （動作確認後、確認用コードは削除する）。

---

## T-028 最終点数モードの満貫以上出現率を抑制（完了）

### 目的

最終点数モード（`/quiz`。満貫以上を出題する唯一のモード）で「満貫以上が多い」という体感を`/grill-plan`セッションで
実測し、裏付けが取れたため是正する。`generateRandomHand`の素の生成分布・実際の`nextProblem()`出力分布とも
**満貫以上が約50%**（内訳: 満貫24.0%／跳満15.4%／倍満8.1%／三倍満1.2%／役満1.5%、none 49.8%。N=20,000〜5,000で実測）で、
教材として基本形（1〜3翻）中心の練習にならず高翻手に偏っていた。

### 確定した設計判断

- **対象範囲**: 最終点数モードのみ。符計算・符分解・点数換算モードは元々満貫以上を出題しないため対象外。
- **対応方式**: 生成側（`randomHand.ts`のリーチ/赤5/ドラ表示牌の確率パラメータ）は変更しない。
  選択側（`weighting.ts`の`categoryBias`）に既存の役満・七対子と同じパターンで係数を追加する
  （生成ロジックに触れず、実測→係数調整のループが速いため）。
- **目標値**: 最終点数モードでの満貫以上出現率を**約15%（許容12〜18%）**に収める。
- **粒度**: 満貫〜三倍満（役満を除く）は**単一の抑制係数**（新設`MANGAN_BIAS`）で一括して比例縮小する。
  素の生成比率が既に「上位区分ほど少ない」傾斜（24.0/15.4/8.1/1.2%）を持つため、翻数帯ごとの個別係数は設けない。
- **既存`MANGAN_FU50_BIAS`（満貫以上×50符以上のブースト）は廃止せず存続**。ただし現行の排他分岐
  （`if (rank !== undefined && fu >= 50) return MANGAN_FU50_BIAS;` で他の係数と掛け合わされず単独確定する構造）
  を変更し、**`MANGAN_BIAS`の上にさらに乗算**する構造にする（新しい一般抑制の対象から50符以上サブセットだけ
  逃げてしまうと、目標15%に届かない・50符タグの露出目的も曖昧になるため）。数値2.2は目標15%達成後に再実測して
  調整し直す（元の2.2は「実出題で約X%」のような目標根拠の記録がなく、決め打ちに近い値だったため）。
- **優先順位は変更しない**: 役満→七対子の排他判定は現行どおり先に評価し、該当すればそちらの係数のみ確定する
  （七対子由来で満貫に達した手も、これまでどおり七対子抑制係数の管轄のまま。満貫以上の一般抑制の対象にしない）。
  役満・七対子いずれにも該当しない場合にのみ、`rank !== undefined`（満貫以上）を見て`MANGAN_BIAS`
  （該当すれば`MANGAN_FU50_BIAS`をさらに乗算）を適用し、どちらにも該当しなければ1倍。
- **実測ツールを恒久化**する。今回`scripts/`配下に新設する分布計測スクリプトは、今後`MANGAN_BIAS`・
  `MANGAN_FU50_BIAS`・`YAKUMAN_BIAS`・`CHIITOI_BIAS`を再調整する際に再利用する。

### 実装時に判明し、確定判断を追加した事項

実装（実測ベースのチューニング）を進める中で、当初の設計判断だけでは目標15%に届かない構造的な壁が
2つ見つかり、都度ユーザーに確認の上でスコープを広げた。

1. **問題バンクの偏り**: `problemBank.json`（51件）は満貫以上53%・役満27%という偏った固定構成で、
   `categoryBias`をどれだけ絞ってもバンク経由（当時25%）の分だけ出現率が下限（実測19%台）に張り付いた。
   → `nextProblem.ts`の生成/バンク混合比を**75%/25% → 90%/10%**に変更（`GENERATOR_RATIO`）。
2. **生成候補数の不足**: 1回の抽選にかける候補が3個だと、「候補3個が全部満貫以上or七対子で揃う」
   （独立確率で約12.5%）という下振れがそのまま出現率の下限になり、係数をゼロに近づけても15%を割れなかった。
   → `GENERATED_CANDIDATE_COUNT`を**3 → 8**に変更（`MAX_CANDIDATE_ATTEMPTS`も12→30に連動）。
   ただしこの変更で役満・七対子の既存バイアス値（0.18・0.31）も効き方の前提が変わり出現率が崩れたため、
   `YAKUMAN_BIAS`（0.18→0.4）・`CHIITOI_BIAS`（0.31→0.13）も含め4係数を再チューニングした。
3. **符計算モードへの巻き添え**: `CHIITOI_BIAS`は符計算モード（`FuQuizPage.tsx`。`chiitoiBias`を上書きしない）
   にも共有される定数のため、2.の変更で符計算モードの七対子出現率も意図せず約2.3%まで低下した
   （T-028の対象範囲は最終点数モードのみのはずが、共有定数経由で漏れた）。
   → `CHIITOI_BIAS_FU_PARTS`と同じ位置づけで**`CHIITOI_BIAS_FU_QUIZ`（符計算モード専用の七対子抑制係数）を新設**し、
   `FuQuizPage.tsx`から明示的に渡すことで、従来水準（約8〜9%）を維持したまま最終点数モードの変更から切り離した。

パフォーマンス（候補数3→8で生成コストが増える懸念）は実測で許容範囲と確認した（`nextProblem()`1回あたり
平均0.30ms・p95 0.61ms・最大4.75ms。Node環境実測だが、UIの体感速度に影響する水準ではない）。

### 最終的な定数値（`weighting.ts`）

| 定数 | 変更前 | 変更後 |
|---|---|---|
| `YAKUMAN_BIAS` | 0.18 | 0.4 |
| `CHIITOI_BIAS` | 0.31 | 0.13 |
| `CHIITOI_BIAS_FU_QUIZ`（新設） | — | 0.45 |
| `CHIITOI_BIAS_FU_PARTS` | 0.12 | 0.12（変更なし） |
| `MANGAN_BIAS`（新設） | — | 0.08 |
| `MANGAN_FU50_BIAS` | 2.2 | 1.6 |

`nextProblem.ts`: `GENERATOR_RATIO` 0.75→0.9、`GENERATED_CANDIDATE_COUNT` 3→8、`MAX_CANDIDATE_ATTEMPTS` 12→30。

### 影響ファイル

- `src/features/practice/application/weighting.ts` — `MANGAN_BIAS`・`CHIITOI_BIAS_FU_QUIZ`新設、
  `categoryBias`を役満→七対子→（満貫以上一般抑制×50符以上追加ブースト）→1倍、の構造に再編。
- `src/features/practice/application/weighting.test.ts` — 新しい優先順位・乗算構造のテストを追加。
- `src/features/practice/application/nextProblem.ts` — `GENERATOR_RATIO`・`GENERATED_CANDIDATE_COUNT`・
  `MAX_CANDIDATE_ATTEMPTS`を変更（影響ファイルとして未記載だったが実装中に判明。上記「実装時に判明」参照）。
- `src/features/practice/application/nextProblem.test.ts` — 符計算/符分解の相対比較テストを
  `CHIITOI_BIAS_FU_QUIZ`基準に更新、統計的検証のタイムアウトを延長。
- `src/features/practice/presentation/FuQuizPage/FuQuizPage.tsx` — `chiitoiBias: CHIITOI_BIAS_FU_QUIZ`を
  明示的に渡すよう変更（影響ファイルとして未記載だったが実装中に判明）。
- `scripts/measureDistribution.ts`（新規）— `generateRandomHand`／`nextProblem`のrank分布をN件実測し、
  役満・七対子・満貫以上（内訳含む）の出現率をコンソール出力する恒久ツール。
- `docs/SPEC.md` §4.1・§4.10（更新済み）。

### 受け入れ基準（検証結果）

- ✅ `scripts/measureDistribution.ts`で`nextProblem()`をN=5,000件実測し、満貫以上の出現率が**12〜18%**に収まる。
  実測: 15.24%・16.26%（2回実測。いずれもレンジ内）。
- ✅ 役満・七対子の出現率が既存目標（役満約3%・七対子約6%）から大きく崩れていない。
  実測: 役満2.76〜3.38%、七対子6.14〜6.38%。
- ✅ 満貫以上×50符以上サブセットが、一般抑制の巻き添えで極端に薄くなっていない。
  実測: 満貫以上全体の約44%（目安の1〜2割を上回り、むしろ厚め＝薄すぎる懸念なし）。
- ✅ 符計算モードの七対子出現率が符分解モードより明確に高い水準（約8〜9%）を保つ（`nextProblem.test.ts`で検証）。
- ✅ `npm test`（515件）・`npm run lint`（今回変更ファイルはエラーなし。無関係な既存差分1件は対象外）が通る。

---
