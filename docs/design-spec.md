# デザイン基準（麻雀点数計算アプリ）

## コンセプト

Airbnb のデザイン言語を参照。純白キャンバス＋Rausch（#ff385c）単色アクセント。
スマホ縦画面を最優先。控えめな見出しウェイト（500〜600）で叫ばず、最重要数値
（点数）だけを突出させる（Airbnb の rating-display に対応）。柔らかい角丸と
「余白＋境界線＋角丸」で奥行きを作り、影は 1 段運用に絞る（Airbnb 1-tier）。
generous whitespace（大セクション 48〜64px のリズム）。
**ダークモードなし（ライト単一・color-scheme: light 固定）**。
白キャンバス・単色 Rausch 基調・スマホ縦最優先は不変。
直値の色・pxは禁止し、必ずトークン（CSS変数）を参照する。

## カラートークン

### ライト（唯一のテーマ）

ダークモードは廃止。テーマは常にライト。

- --color-bg: #FFFFFF /_ 背景（純白キャンバス。Airbnb canvas） _/
- --color-surface: #F7F7F7 /_ 基準の面（Airbnb surface-soft） _/
- --color-surface-2: #FFFFFF /_ カード面。border で bg から分離（影に頼らない） _/
- --color-text: #222222 /_ 通常テキスト（Airbnb ink。純黒にしない） _/
- --color-text-sub: #6A6A6A /_ 補助テキスト（Airbnb muted） _/
- --color-accent: #FF385C /_ 主役の差し色（Rausch 単色） _/
- --color-accent-active: #E00B41 /_ 押下/hover のより濃い Rausch _/
- --color-border: #DDDDDD /_ 既定の 1px 境界（Airbnb hairline） _/
- --color-border-soft: #EBEBEB /_ 補助の淡い境界（Airbnb hairline-soft） _/
- --color-accent-contrast: #FFFFFF /_ Rausch 上の文字（on-primary） _/
- --gradient-accent /_ Rausch グラデ（#ff385c→#e00b41）。主ボタン・進捗バーのみ _/
- --color-accent-bg /_ アクセント淡色の背景（Rausch のごく淡いピンク。自風バッジ等） _/
- --color-accent-border /_ アクセント淡色の境界線 _/
- --color-accent-text /_ アクセント淡背景上で読める濃赤（AA 4.5:1 を満たす） _/

## サーフェス（面の階層）

- --color-surface: 基準の面（Airbnb surface-soft #f7f7f7）。
- --color-surface-2: カード本体・stat-card・内訳ボックス等の面（#ffffff）。
  影ではなく境界線（--color-border）＋余白＋角丸で bg から分離する（Airbnb 流）。

## アクセント運用（グラデーション）

- --gradient-accent: Rausch グラデ（#ff385c→#e00b41 の線形グラデ）。
- 適用は「主役」のみに限定する＝主ボタン（.btn-primary）と進捗バーの fill。
  スコア・面・本文・バッジ・見出しはグラデを使わず単色（--color-accent / --color-text）を維持する。
  ※バッジの淡色塗り（局条件バッジ等）は単色 Rausch の淡色トークン（--color-accent-bg 系）に限り可。グラデは使わない。
- セカンダリ（第2の）アクセント色は導入しない。差し色は単色 Rausch 基調で統一する。
  役ごと・風ごとに異なる色相で塗り分ける多色パレットは導入しない。

## エレベーション（1段運用／Airbnb 1-tier）

- 静止面（カード・stat-card・内訳ボックス・result-alt 等）は**影を持たない**。
  奥行きは「余白＋境界線（--color-border）＋角丸」で表現する（Airbnb 流）。
- 影は hover / 最前面（モーダル）に限り 1 段だけ使う（--shadow-sm 相当）。
- --shadow-sm / --shadow-md / --shadow-lg のトークンは後方互換のため残すが、
  運用は上記 1 段に絞る（多層の段階付けは行わない）。
- 既存 --shadow-card は --shadow-sm へのエイリアスとして維持（後方互換）。

## モーション

- --duration-fast: 120ms（hover/軽い状態変化）、--duration: 200ms（押下・移動）。
- --ease-standard: cubic-bezier(.2, 0, 0, 1)。
- 原則: hover / active / focus は必ずトランジションを伴う（唐突な変化を禁止）。
- hover 演出はポインタ環境（@media (hover: hover)）に限定し、タッチでは active を主とする。
- prefers-reduced-motion: reduce の環境では transition / transform を無効化する。

## 強調レベル（3段階・サイズと色の両方で強弱）

見出し（h1/h2）は Airbnb 流に控えめウェイト（600 基調）とし、タイポで叫ばない。
大型タイポ（L1・700）は点数と、解説画面の正誤見出し（○正解＝緑／✕不正解＝danger の濃赤）に限り、最重要情報だけを突出させる。答え（点数）は Rausch のため、不正解見出しは danger 色で区別する。

- レベル1／最強調 = 点数（各ドリルの答え表示。符計算モードの「答え: XX符」も L1 に含める。色は --color-accent）と、解説画面の正誤見出し（正解＝--color-success-text／不正解＝--color-danger-text）
  - font-size: --fs-score（3rem目安）、font-weight 700、色 --color-accent（Rausch）、数字専用フォント
- レベル2／中 = 翻・符・役名（内訳・計算式に現れる符。各ドリルの「正解」表示は上記 L1）
  - font-size: --fs-emphasis（1.5rem目安）、font-weight 600、色 --color-text（数字は専用フォント）
- レベル3／通常 = その他ラベル・説明
  - font-size: --fs-base（1rem目安）、色 --color-text / 補助は --color-text-sub
  - 補助ラベル・キャプション（バッジ・注記・フッター等）は --fs-sm（0.875rem目安）＋ --color-text-sub

## 局条件バッジ（出題画面の場風・自風・親子・上がり方・リーチ）

- バッジは役割ごとに「小さいラベル＋強調した値」の2段構造を基本とする。
  - ラベル: --fs-sm ＋ --color-text-sub（淡塗りタグ上は AA を満たす --color-accent-text）。
  - 値（風牌・親/子・ロン/ツモ・リーチ）: font-weight 700 ＋ --color-text。強調は L3 の範囲内に留め、L2（--fs-emphasis）までは上げない（点数・選択肢より目立たせない）。
- 場風・自風は独立2バッジにせず、「東場南家」形式の1タグ（風コンテキスト）に統合する（例: 場風=東・自風=南 →「東場南家」。東=場風の値／場=役割、南=自風の値／家=役割）。
  - 統合タグ（windset）: Rausch 淡塗り（--color-accent-bg / --color-accent-border、文字は --color-accent-text）。自風（自分の座）を含むため、自分に関わる情報として淡塗りで強調する。
  - タグ内は「風文字（東・南）」と「役割文字（場・家）」を交互に並べる。風文字は --fs-base、役割文字は --fs-sm とし、風文字を一段だけ大きくする。いずれも強調は L3 の範囲内に留め、L2（--fs-emphasis）までは上げない。
  - 場風／自風の役割区別は塗りではなく「場」「家」の文字で行う（多色パレットは使わない）。
  - 親子（dealer）・上がり方（wintype）: 中立ベース。値のみ強調（色は足さない）。
  - リーチ: danger トーン（--color-danger-bg 系）を維持。
- 区別は色のみに依存させない。役割は「場」「家」の文字で示し、色覚多様性でも判別できるようにする。淡背景上の文字色はコントラスト AA（4.5:1）を満たす。
- バッジはタップ対象ではないため、44px の最小タップ領域は適用しない。

## タイポグラフィ

- **外部Webフォントは使用しない**（Inter/Cereal 等を @import しない）。システムフォールバックのみ。
- 数字（点数・翻・符）: 数字専用フォント（システムのコンデンス系フォールバック）。
  桁揃えのため font-variant-numeric: tabular-nums を必須とする。
- 日本語テキスト: システム標準の sans-serif。
- 見出しウェイトは Airbnb 流に控えめ（600 基調）。本文 400。点数のみ 700。
- サイズトークン: --fs-score / --fs-emphasis / --fs-base / --fs-sm（補助ラベル・キャプション用）を定義し、直値pxを使わない。
- 字間・行間トークン: --tracking-tight（-0.01〜-0.02em。見出し・スコアの引き締め用）、
  --leading-tight（見出し・スコア）／--leading-normal（本文）を定義する。

## 余白（4px ベース／Airbnb 余白哲学）

- --space-0: 2px（マイクロ）
- --space-1: 4px / --space-2: 8px / --space-3: 12px / --space-4: 16px / --space-5: 24px / --space-6: 32px
- --space-7: 48px / --space-8: 64px（section）
- リズム: 大セクション間は 48〜64px（section）で開ける。カード内の余白は 16〜24px。
  密なガター（バッジ間・牌間）は 4〜8px。「開けた見出し／密なカード」の対比を作る。

## 形状

- 角丸はスケール化してトークン参照する（Airbnb の役割分担に合わせる）。
  - --radius-xs: 4px（極小の区切り）
  - --radius-sm: 8px（ボタン＝btn-primary/secondary/quiz-choice-btn）
  - --radius: 14px（カード＝.card / .stat-card / .result-alt）
  - --radius-lg: 20px（大きめパネル。必要時のみ）
  - --radius-pill: 999px（バッジ・進捗バー）
  - 牌（tiles）の角丸・寸法は画像の幾何に依存するため据え置き。

## ヘッダー／フッター（Airbnb 帯化）

- ヘッダー（.page-header）: 白キャンバス＋下 1px hairline の帯。角丸なし・グラス（backdrop-filter／半透明）なし。sticky は維持。
- フッター（.app-footer）: 白キャンバス＋上 1px hairline。角丸なし・グラスなし。

## 操作性（スマホ縦最優先）

- タップ領域は最低44px四方。主要ボタンは高さ48px以上を推奨。
- 片手操作を想定し、主要な操作は画面下部側に置けると望ましい。

## 禁止事項

- 色・サイズ・角丸の直値書き（#RRGGBB / px / rem直書き）。必ずトークン参照。
- 同じ役割の要素を画面ごとに違う規則でスタイルすること（統一を最優先）。

### 機能寸法の直値例外

以下は「見た目のトークン」ではなく機能・レイアウト上の寸法要件であり、直値禁止の対象外とする（トークン化しなくてよい）:

- タップ/ボタンの最小寸法（44px / 48px / 56px 等の min-height）。
- 牌（tiles）の幾何寸法および牌間の gap / padding。
- メディアクエリのブレークポイント。
- hairline としての境界線の幅 1px（例: `1px solid var(--color-border)`。色はトークン参照、幅の 1px は対象外）。
