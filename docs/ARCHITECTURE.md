# ARCHITECTURE.md — フォルダ構成・依存ルール（正典）

> 本書は、フォルダ構成・レイヤー分割・依存ルールに関する正典。`SPEC.md`（製品仕様）・`STYLE-TRANSFER.md`（CSS移行ルール）とは別の関心事として独立させている。`/grilling`セッション（bulletproof-react＋オニオンアーキテクチャでDDDを実現する方針の検討）で確定した判断を記す。個々の移行タスクは `TASKS.md` の T-019 以降を参照。

---

## A1. 背景・目的

既存実装（`engine/`・`generator/`・`store/`・`settings/`・`components/`等）はロジックとしては妥当に分離されていたが、フォルダ構成としては「機能の境界」が見えにくかった（`components/`が40ファイル超フラット）。将来の機能追加時に置き場所で迷わないよう、**bulletproof-reactの機能単位フォルダ**と**オニオンアーキテクチャの層分離**を組み合わせた構成に段階移行する。

## A2. 全体方針: 機能で縦割り、内部を層で整理

bulletproof-react（feature-first）とオニオン（layer-first）は思想が異なるため、素直に組み合わせると衝突する。本アプリでは**トップレベルは機能で縦割り（`features/`）、各feature内部を軽くオニオン層で整理する**ハイブリッドを採用する。

## A3. ドメインモデルの棚卸しと境界づけられたコンテキスト

既存コードから拾える主要ドメイン概念を棚卸しした結果、以下の非対称な構造になっている。

| # | 関心事 | 主な既存モジュール | 位置づけ |
| - | ------ | ------------------ | -------- |
| ① | 採点（Scoring） | `engine/*` | **唯一のコア・ドメイン**。何にも依存せず、全員から依存される。 |
| ② | 出題（Practice） | `generator/*`・`store/nextProblem.ts`・`data/problem.ts`・`Quiz*`/`Fu*`/`Convert*`/`Result*`系コンポーネント | ①に依存する応用ロジック。4モード（最終点数・符計算・符分解・点数換算）をまとめて1つのbounded contextとして扱う。 |
| ③ | 成績・復習（Stats） | `store/statsStore.ts`・`store/weighting.ts`・`StatsPage` | 当初は独立featureを検討したが、`nextProblem.ts`が`loadStats()`を呼び、`recordAnswer(problem: Problem, …)`が②のドメイン型`Problem`を直接受け取るという**相互依存**が判明。②抜きでは意味を成さないため、**②`practice`に統合**する（独立featureにしない）。`StatsPage`は`features/practice/presentation`の1画面として扱う。 |
| ④ | 設定（Settings） | `settings/*`（`SettingsRepository`＋`IndexedDbSettingsRepository`の抽象/実装分離が既にある） | 独立feature。 |
| ⑤ | 記事（Articles） | `content/articles/*`・`Article*`系コンポーネント | 独立feature。①のTileモデルを表示のためだけに参照する。 |

静的ページ（ホーム・about・contact・privacy）と出題モードの定義（`config/modes.ts`＝`ModeId`/`ModeDef`）はドメイン概念を持たず「画面組み立て・ルーティング」の関心事のため、`features/`に含めず`app/`に置く（A4参照）。

## A4. トップレベル構成

```
src/
  core/
    scoring/
      domain/             # ①採点コア・ドメイン。他の層に一切依存しない（旧engine/→core-domain/。A8参照）
  features/
    practice/             # ②出題（4モード）＋③成績・復習を統合
      domain/  application/  infrastructure/  presentation/
    settings/              # ④設定（移行パイロット。A9参照）
      domain/  application/  infrastructure/  presentation/
    articles/              # ⑤記事
      domain/  application/  infrastructure/  presentation/
  shared/                  # 複数featureから使う共有UI（牌描画一式・PageHeader/Footer/Sidebar/ErrorBoundary/ScrollTop/ChoiceGrid等）
  app/                     # ルーティング・静的ページ・画面組み立て・config/modes.ts（旧App.tsx, HomePage, About/Contact/Privacy）
```

## A5. 各featureの内部層

DDDの層をそのまま明示する（bulletproof-react慣例の`api/components/hooks/…`ではなく、学習・実践目的のため層名を可視化する）。

- **`domain/`**: そのfeature固有の概念・値オブジェクト・純粋な検証/変換ロジック。他層に依存しない。例: `practice`の`Problem`/`ProblemConditions`/`ProblemTags`、`settings`の`AppSettings`＋`parseSettings`、`articles`の`ArticleMeta`。
- **`application/`**: `engine/`（コア）と自featureの`domain/`を使って実際のユースケースを実行するオーケストレーション層。永続化・外部I/Oの**抽象（ポート）**もここに定義する。例: `practice`の`generateProblem`/`nextProblem`/`distractors`/`weighting`/`recordAnswer`、`settings`の`SettingsRepository`インターフェース。
- **`infrastructure/`**: `application/`が定義したポートの具体実装（アダプタ）。localStorage・IndexedDB・JSON読み込み等の外部I/O。例: `practice`の`problemBank.json`読み込み・`statsStore`のlocalStorage実装、`settings`の`IndexedDbSettingsRepository`・合成ルート（`settingsRepository.instance.ts`は自feature内部の配線としてここに置く。A6参照）。
- **`presentation/`**: Reactコンポーネント・hooks・Context Provider。例: `QuizPage`/`FuQuizPage`/`ResultPage`/`StatsPage`、`SettingsPage`/`SettingsContext`、`ArticleListPage`/`ArticlePage`。

### A5.1 補足: なぜ永続化の抽象（ポート）を`domain/`ではなく`application/`に置くか

DDD/オニオンの文献には実は2つの流儀がある。

- **クラシックなオニオン（Palermo流）**: リポジトリの抽象は「ドメインが必要とするもの」として`domain/`（Domain Model層）が所有する。`application/`はユースケースのオーケストレーションのみを置く。
- **クリーンアーキテクチャ／ポート＆アダプタ（ヘキサゴナル）流**: リポジトリの抽象（アウトバウンドポート）は「そのユースケースが外部に何を要求するか」の宣言として`application/`（Use Case層）が所有する。実装（アダプタ）は`infrastructure/`が担う。

本プロジェクトは**後者（クリーンアーキテクチャ／ポート＆アダプタ流）を採用する**。理由は、これが今日のTypeScript実装で最も一般的な流儀であり、`application/`を「外部依存の抽象を宣言する境界」として一貫させられるため。

この流儀での`application/`の役割は、実は無関係な2つではなく、**ポート＆アダプタの"ポート"が2種類ある**ことの両面である。

- **インバウンドポート（駆動される側）**: ユースケース関数そのもの（例: `nextProblem()`・`recordAnswer()`）。`presentation/`はこの関数を呼ぶだけで中身を知らない。
- **アウトバウンドポート（駆動する側）**: そのユースケース関数が外部（`infrastructure/`）に要求するインターフェース（例: `SettingsRepository`）。

**オーケストレーション＝インバウンドポート（ユースケース関数）の実装本体であり、その実装が使う依存がアウトバウンドポートとして`application/`に宣言される**、という一体の関係である。`settings`のようにユースケース関数が実質存在しない薄いfeatureでは、アウトバウンドポート宣言（`SettingsRepository`インターフェース）だけが`application/`に見える状態になるが、これは流儀の逸脱ではなく、featureが薄いことの当然の帰結である（`practice`移行後は`nextProblem`等のインバウンドポートも揃って見える）。

## A6. 依存ルール

- 依存の向きは常に「外側→内側」（`presentation → application → domain`、`infrastructure → application`のポートを実装）。内側の層は外側を知らない。
- `core/scoring/domain/`は`features/`・`shared/`・`app/`のいずれにも依存しない（唯一のコア）。
- `features/*`は原則として他の`features/*`を直接importしない（必要なら`shared/`経由）。
- **例外を1つだけ明示的に許可する**: `features/practice`は`features/settings`を直接importしてよい（切り上げ満貫設定`roundUpMangan`を読み取り`scoreHand`に渡すため）。これは片方向依存であり、`settings`は`practice`の存在を知らない。ESLint設定にはこの1行例外をコメント付きで明記する。
- `app/`はどこからでも（`engine/`・`features/*`・`shared/`）importしてよい。
- `settingsRepository.instance.ts`のような**feature内部の合成ルート**（1つの具体アダプタをそのfeature内で束ねる配線）は、そのfeatureの`infrastructure/`に留める。`app/`の合成ルートとは異なり、他featureから参照されない限りfeature外に出さない。

## A7. ESLintによる強制

- 素のESLint（`no-restricted-imports`等、追加パッケージ不要）でA6のルールをパスパターンとして強制する。
- **適用範囲は新設フォルダ（`core/features/shared/app`）のみ**。段階移行中は旧`components/`・`store/`・`content/`・`data/`・`settings/`（トップレベル直下）を除外パターンとし、移行が完了した部分から順次ルール適用範囲に加える。

## A8. パスエイリアス・命名規約

- `tsconfig`の`paths`（`"@/*": ["./src/*"]`という単一ワイルドカード。Vite側は`vite-tsconfig-paths`プラグインがこれをそのまま解決する）で`src/`配下への絶対パスimportを提供する。フォルダごとの個別エイリアス定義はない。
- コア・ドメイン層は`core/<集約名>/domain/`と命名する（現状は`core/scoring/domain/`のみ）。
  - トップレベルは`core/`とする。複数feature（`practice`・`articles`）から依存される共有カーネルという性格を持ち、将来他の共有カーネルが増えても同じ形で収まる入れ物にする。
  - `core/`の直下に集約名（`scoring`）を挟む。「何のcoreか」を`core/`という汎用語だけに頼らず、パス自体で明示するため。
  - `scoring/`配下は`domain/`のみを持つ（`application/`はポートを伴うユースケースが必要になった時にのみ追加する。現状は完全に純粋関数でI/Oを持たないため不要）。`features/*`の内部層（A5）と同じ`domain/`・`application/`という語彙を使い、共有カーネルも1つのfeatureと同じ考え方で読めるようにする。`features/*/domain/`と字面上は同じ`domain`という語を使うが、パス全体（`core/scoring/domain/` vs `features/practice/domain/`）で見れば曖昧にならない。
- `core/scoring/domain/`内部は、Entity/Value Objectとドメインサービスをファイル名で区別する。
  - **Entity/VO**: 概念そのものの名前をファイル名にする（suffixなし）。`tile.ts`（`Suit`/`Tile`/`HONOR_NAMES`/`SUIT_LABELS`。Tileの検証・比較・整形・分類といったTile自身の振る舞いも同居させる。旧`tileType.ts`・`tiles.ts`はここに統合）、`meld.ts`（`MeldType`/`Meld`）、`matchContext.ts`（`Wind`/`WinType`/`WIND_TO_HONOR_RANK`）。旧`model.ts`はこの3ファイルに分割する。
  - **ドメインサービス**: `<概念>Service.ts`と命名する。`decomposeService.ts`・`interpretationService.ts`・`yakuService.ts`・`yakumanService.ts`・`fuService.ts`・`doraService.ts`・`scoreService.ts`・`scoreHandService.ts`（旧`decompose.ts`・`interpretation.ts`・`yaku.ts`・`yakuman.ts`・`fu.ts`・`dora.ts`・`score.ts`・`scoreHand.ts`）。
  - `scoreHandService.ts`は他の8つのドメインサービスを呼び出して採点結果を組み立てるが、feature固有の型もI/Oも一切参照しない。「麻雀の手を採点する」という操作自体が麻雀ドメインの定義そのものであり、特定ユースケース向けの手順ではないため、application層ではなくドメインサービスとして扱う。
  - `*.test.ts`は対応するソースファイルと同名で同居させる（`tile.test.ts`は旧`tileType.test.ts`・`tiles.test.ts`を統合）。`yakuCatalogue.test.ts`は対応する同名ソースファイルを持たない独立した回帰テスト（`scoreHandService`を広範な役の組み合わせで検証する）のため、リネーム対象外とする。

## A9. 移行方針

- 一括移行はせず、**段階移行**（新規構成を確定させ、既存は機能単位で順次移す）。
- **パイロットは`features/settings`から着手**する。理由: `SettingsRepository`/`IndexedDbSettingsRepository`という抽象/実装分離が既にあり、目標構成との差分が最小＝低リスクでフォルダ構成・ESLintルール・パスエイリアスを検証できる。
- 移行順序（依存関係に基づく）: `settings`（パイロット）→ `shared/`新設（牌描画等の共有UI抽出）→ `articles`（`shared/`に依存）→ `practice`（`shared/`・`settings`に依存、最大・最高リスクのため最後）→ `app/`新設（全feature配線後）→ 旧ディレクトリ削除・`CLAUDE.md`更新。
- 具体的なタスク分解は `TASKS.md` T-019以降を参照。
