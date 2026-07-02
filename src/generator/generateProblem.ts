import type { Problem } from "../data/problem";
import { generateRandomHand } from "./randomHand";
import type { RandomSource } from "./random";

let generatedCount = 0;

/**
 * ランダムな問題を1問生成する。役が成立する正当な手が見つからなければ null を返す
 * （呼び出し側で再試行するか、問題バンクにフォールバックする）。
 */
export function generateProblem(rng: RandomSource = Math.random): Problem | null {
  const hand = generateRandomHand(rng);
  if (!hand) return null;

  generatedCount += 1;
  const id = `generated-${Date.now()}-${generatedCount}-${Math.floor(rng() * 1_000_000)}`;

  return {
    id,
    source: "generated",
    hand: {
      concealed: hand.concealed,
      melds: hand.melds,
      winningTile: hand.winningTile,
      winType: hand.winType,
    },
    doraIndicators: hand.doraIndicators,
    uraDoraIndicators: hand.uraDoraIndicators,
    conditions: {
      seatWind: hand.seatWind,
      roundWind: hand.roundWind,
      isDealer: hand.isDealer,
      riichi: hand.riichi,
    },
    answer: hand.answer,
    tags: {
      fuType: hand.answer.fu,
      yakuCategories: hand.answer.yaku.map((y) => y.name),
    },
  };
}
