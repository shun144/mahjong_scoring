import type { Wind, WinType } from "../engine/model";
import type { Payment, ScoreRank, ScoreResult } from "../engine/score";

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
  if (payment.kind === "ron") return `${payment.total}点`;
  if (payment.kind === "tsumo-oya") return `${payment.each}点オール`;
  return `子${payment.nonDealer}点 / 親${payment.dealer}点`;
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
  return `${scoreBasis} → ${dealerLabel}${WIN_TYPE_LABELS[winType]} ${formatPayment(answer.payment)}`;
}
