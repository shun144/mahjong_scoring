import type { Wind, WinType } from "../../../engine/model";
import { basicPoints, type Payment, type ScoreRank, type ScoreResult } from "../../../engine/score";
import type { ConversionQuestion } from "../application/conversion";

export const WIND_LABELS: Record<Wind, string> = {
  east: "東",
  south: "南",
  west: "西",
  north: "北",
};

export const WIN_TYPE_LABELS: Record<WinType, string> = {
  tsumo: "ツモ",
  ron: "ロン",
};

export const RANK_LABELS: Record<ScoreRank, string> = {
  mangan: "満貫",
  haneman: "跳満",
  baiman: "倍満",
  sanbaiman: "三倍満",
  yakuman: "役満",
};

/**
 * 点数を選択肢/解説用の表示文字列に整形する（SPEC.md §4.2）。
 * ロン=単一値／子ツモ=「子X/親Y」／親ツモ=「Xオール」。
 */
export function formatPayment(payment: Payment): string {
  if (payment.kind === "ron") return `${payment.total}`;
  if (payment.kind === "tsumo-oya") return `${payment.each}オール`;
  return `${payment.nonDealer} / ${payment.dealer}`;
}

/**
 * 解説画面の計算式を整形する（SPEC.md §4.4 例: 「40符3翻 → 子ロン 5200」）。
 * 満貫以上は符が結果に影響しないため、符ではなく区分名を示す。
 */
export function formatCalculationLine(
  answer: ScoreResult,
  isDealer: boolean,
  winType: WinType,
): string {
  const scoreBasis = answer.rank
    ? `${answer.han}翻 ${RANK_LABELS[answer.rank]}`
    : `${answer.fu}符${answer.han}翻`;
  const dealerLabel = isDealer ? "親" : "子";
  return `${scoreBasis} (${dealerLabel}${WIN_TYPE_LABELS[winType]}) → ${formatPayment(answer.payment)}`;
}

/** 点数換算モードの計算式の構成要素（SPEC.md §4.9）。 */
export interface ConversionFormulaParts {
  fu: number;
  han: number;
  /** 指数の直後に置くラベル（例: `×4(子ロン)` / `×2(親ツモ)` / `(子ツモ)`）。 */
  multiplierLabel: string;
  /** 左辺（符 × 2^(2+翻) × 倍率）の積。子ツモは基本点（子の払い＝×1相当）。 */
  product: number;
  /** 積と最終額が異なる（100点未満切り上げが生じた）か。子ツモは常に真（子/親の内訳を示すため）。 */
  rounded: boolean;
  /** 最終的な支払い（`formatPayment` 済み）。 */
  paymentText: string;
}

/** 基本点（符 × 2^(2+翻)）に掛かる、丸め前の理論倍率。 */
function conversionMultiplier(winType: WinType, isDealer: boolean): number {
  if (winType === "ron") return isDealer ? 6 : 4;
  return 2; // tsumo-oya（tsumo-koは子の払いを基準にするため×1相当。呼び出し側で分岐）
}

/**
 * 点数換算モードの計算式を構成要素に分解する（SPEC.md §4.9）。
 * ロン・親ツモは倍率が1つなので「符 × 2^(2+翻) × 倍率」をそのまま展開し、
 * 子ツモは子×1／親×2の2支払いのため、基本点から最終の「子 / 親」表示へ矢印でつなぐ。
 */
export function conversionFormulaParts(question: ConversionQuestion): ConversionFormulaParts {
  const { fu, han, isDealer, winType, answer } = question;
  const base = basicPoints(han, fu);
  const paymentText = formatPayment(answer);

  if (answer.kind === "tsumo-ko") {
    return {
      fu,
      han,
      multiplierLabel: "(子ツモ)",
      product: base,
      rounded: true,
      paymentText,
    };
  }

  const multiplier = conversionMultiplier(winType, isDealer);
  const dealerLabel = isDealer ? "親" : "子";
  const product = base * multiplier;
  const finalAmount = answer.kind === "ron" ? answer.total : answer.each;

  return {
    fu,
    han,
    multiplierLabel: `×${multiplier}(${dealerLabel}${WIN_TYPE_LABELS[winType]})`,
    product,
    rounded: product !== finalAmount,
    paymentText,
  };
}

/**
 * 点数換算モードの計算式を平文に整形する（スクリーンリーダー用。SPEC.md §4.9 例:
 * 「50符 × 2^(2+1翻) ×4(子ロン) = 1600」／切り上げ時「= 960 → 1000」）。
 * 累乗の上付き表示はJSX側（`<sup>`）で行うため、ここでは `^` 表記のまま返す。
 */
export function formatConversionFormula(question: ConversionQuestion): string {
  const { fu, han, multiplierLabel, product, rounded, paymentText } =
    conversionFormulaParts(question);
  const left = `${fu}符 × 2^(2+${han}翻) ${multiplierLabel}`;
  // 丸めが無ければ product は最終額と同値なので paymentText（オール等の接尾辞込み）をそのまま使う。
  const right = rounded ? `${product} → ${paymentText}` : paymentText;
  return `${left} = ${right}`;
}
