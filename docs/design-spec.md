# デザイン基準（麻雀点数計算アプリ）

## コンセプト

明るくポップ。白基調＋ビビッドなインディゴの差し色。スマホ縦画面を最優先。
柔らかな奥行き（多層シャドウ）と機敏なモーションを伴うモダンUI。
ただし白基調・単色インディゴ基調・スマホ縦最優先は不変。
ダークモード対応（ライト/ダーク切替）。直値の色・pxは禁止し、必ずトークン（CSS変数）を参照する。

## カラートークン

### ライト（デフォルト）

- --color-bg: #FFFFFF /_ 背景（白基調） _/
- --color-surface: #F5F5F7 /_ カード・パネル _/
- --color-text: #1A1A1A /_ 通常テキスト _/
- --color-text-sub: #6B7280 /_ 補助テキスト _/
- --color-accent: #4F46E5 /_ 主役の差し色（ビビッドなインディゴ） _/
- --color-border: #E5E7EB
- --color-accent-bg /_ アクセント淡色の背景（バッジ等の淡塗り。単色インディゴの範囲内） _/
- --color-accent-border /_ アクセント淡色の境界線 _/
- --color-accent-text /_ アクセント淡背景上で読める文字色（AA 4.5:1 を満たす） _/

### ダーク

- --color-bg: #15171C
- --color-surface: #20232B
- --color-text: #F5F5F7
- --color-text-sub: #9CA3AF
- --color-accent: #818CF8 /_ 暗背景で沈まないよう1段明るいインディゴ _/
- --color-border: #333842
- --color-accent-bg /_ アクセント淡色の背景（暗背景で沈まない淡インディゴ） _/
- --color-accent-border /_ アクセント淡色の境界線 _/
- --color-accent-text /_ アクセント淡背景上で読める文字色（AA 4.5:1 を満たす） _/

## サーフェス（面の階層）

- --color-surface: 基準の面（カード・パネルの下地）。
- --color-surface-2: 一段浮いた面（カード本体・stat-card・内訳ボックス等）。
  背景 bg との間にトーン差を作り、多層シャドウと合わせて奥行きを表現する。
  ライトは surface より僅かに白寄り、ダークは僅かに明るいグレーで浮かせる。

## アクセント運用（グラデーション）

- --gradient-accent: インディゴ→バイオレットの線形グラデ（ダークは1段明るい版）。
- 適用は「主役」のみに限定する＝主ボタン（.btn-primary）と進捗バーの fill。
  スコア・面・本文・バッジ・見出しはグラデを使わず単色（--color-accent / --color-text）を維持する。
  ※バッジの淡色塗り（局条件バッジ等）は単色インディゴの淡色トークン（--color-accent-bg 系）に限り可。グラデは使わない。
- セカンダリ（第2の）アクセント色は導入しない。差し色は単色インディゴ基調で統一する。
  役ごと・風ごとに異なる色相で塗り分ける多色パレットは導入しない。

## エレベーション（多層シャドウ）

- --shadow-sm / --shadow-md / --shadow-lg の3段階。いずれも低不透明度を重ねた
  多層シャドウ（環境光＋接地影）で柔らかい奥行きを出す。
- ダークは影を強め、境界線（--color-border）で階層を補強する。
- 既存 --shadow-card は --shadow-sm へのエイリアスとして維持（後方互換）。
- 使い分け: カード等の静止面=sm、hover 時=md、モーダル/最前面=lg。

## モーション

- --duration-fast: 120ms（hover/軽い状態変化）、--duration: 200ms（押下・移動）。
- --ease-standard: cubic-bezier(.2, 0, 0, 1)。
- 原則: hover / active / focus は必ずトランジションを伴う（唐突な変化を禁止）。
- hover 演出はポインタ環境（@media (hover: hover)）に限定し、タッチでは active を主とする。
- prefers-reduced-motion: reduce の環境では transition / transform を無効化する。

## 強調レベル（3段階・サイズと色の両方で強弱）

- レベル1／最強調 = 点数
  - font-size: --fs-score（3rem目安）、太字、色 --color-accent、数字専用フォント
- レベル2／中 = 翻・符・役名
  - font-size: --fs-emphasis（1.5rem目安）、太字、色 --color-text（数字は専用フォント）
- レベル3／通常 = その他ラベル・説明
  - font-size: --fs-base（1rem目安）、色 --color-text / 補助は --color-text-sub
  - 補助ラベル・キャプション（バッジ・注記・フッター等）は --fs-sm（0.875rem目安）＋ --color-text-sub

## 局条件バッジ（出題画面の場風・自風・親子・上がり方・リーチ）

- バッジは役割ごとに「小さいラベル＋強調した値」の2段構造とする。
  - ラベル（「場風」「自風」）: --fs-sm ＋ --color-text-sub。
  - 値（風牌・親/子・ロン/ツモ・リーチ）: font-weight 700 ＋ --color-text。強調は L3 の範囲内に留め、L2（--fs-emphasis）までは上げない（点数・選択肢より目立たせない）。
- 場風と自風を一目で区別するため、役割で塗りを変える（多色パレットは使わない）:
  - 自風（seat）: アクセント淡塗り（--color-accent-bg / --color-accent-border、値は --color-accent-text）。自分に関わる情報を強調。
  - 場風（round）: 中立の輪郭（--color-surface ＋ --color-border）。値のみ強調。
  - 親子（dealer）・上がり方（wintype）: 中立ベース。値のみ強調（色は足さない）。
  - リーチ: danger トーン（--color-danger-bg 系）を維持。
- 区別は色のみに依存させない。ラベル文字（場風/自風）を残し、色覚多様性でも判別できるようにする。淡背景上の文字色はコントラスト AA（4.5:1）を満たす。
- バッジはタップ対象ではないため、44px の最小タップ領域は適用しない。

## タイポグラフィ

- 数字（点数・翻・符）: インパクトのある数字専用フォント（例: Bebas Neue / Oswald 等）。
  桁揃えのため font-variant-numeric: tabular-nums を必須とする。
- 日本語テキスト: システム標準の sans-serif。
- サイズトークン: --fs-score / --fs-emphasis / --fs-base / --fs-sm（補助ラベル・キャプション用）を定義し、直値pxを使わない。
- 字間・行間トークン: --tracking-tight（-0.01〜-0.02em。見出し・スコアの引き締め用）、
  --leading-tight（見出し・スコア）／--leading-normal（本文）を定義する。

## 形状

- 角丸はスケール化してトークン参照する（役割でリズムを付ける）。
  - --radius-sm: 8px（小要素）
  - --radius: 14px（ボタン等の中間）
  - --radius-lg: 20px（カード・パネル寄り）
  - --radius-pill: 999px（バッジ・進捗バー）
  - 牌（tiles）の角丸・寸法は画像の幾何に依存するため据え置き。

## 操作性（スマホ縦最優先）

- タップ領域は最低44px四方。主要ボタンは高さ48px以上を推奨。
- 片手操作を想定し、主要な操作は画面下部側に置けると望ましい。

## 禁止事項

- 色・サイズ・角丸の直値書き（#RRGGBB / px / rem直書き）。必ずトークン参照。
- 同じ役割の要素を画面ごとに違う規則でスタイルすること（統一を最優先）。
