import type { Meld, Tile, Wind, WinType } from "@/engine/model";
import { scoreHand, type ScoreHandInput } from "@/engine/scoreHand";
import type { ScoreResult } from "@/engine/score";

export interface ProblemHand {
  /** 純手牌（副露を除く。上がり牌を含む）。 */
  concealed: Tile[];
  melds: Meld[];
  winningTile: Tile;
  winType: WinType;
}

export interface ProblemConditions {
  seatWind: Wind;
  roundWind: Wind;
  isDealer: boolean;
  riichi: boolean;
}

export interface ProblemTags {
  /** 符計算後の値（20/25/30/40/50/60/70...）。苦手復習の集計キー。 */
  fuType: number;
  /** 成立した役の名称一覧。苦手復習の集計キー。 */
  yakuCategories: string[];
}

export interface Problem {
  id: string;
  source: "bank" | "generated";
  hand: ProblemHand;
  /** ドラ表示牌（実際のドラはSPEC.md §5.4の変換ルールで読み替える）。 */
  doraIndicators: Tile[];
  /** 裏ドラ表示牌（リーチ時のみ。非リーチ時は空配列）。 */
  uraDoraIndicators: Tile[];
  conditions: ProblemConditions;
  answer: ScoreResult;
  tags: ProblemTags;
}

/** Problem を scoreHand() の入力形式に変換する。 */
export function problemToScoreHandInput(problem: Problem): ScoreHandInput {
  return {
    concealed: problem.hand.concealed,
    melds: problem.hand.melds,
    winningTile: problem.hand.winningTile,
    winType: problem.hand.winType,
    doraIndicators: problem.doraIndicators,
    uraDoraIndicators: problem.uraDoraIndicators,
    seatWind: problem.conditions.seatWind,
    roundWind: problem.conditions.roundWind,
    isDealer: problem.conditions.isDealer,
    riichi: problem.conditions.riichi,
  };
}

/**
 * 切り上げ満貫設定を反映した実効Problemを返す（点数計算モード専用）。
 * scoreHandをroundUpManganオプション付きで再実行し、answer（payment/rank/interpretationNote）
 * を差し替える。scoreHandは決定的なため、roundUpMangan=falseでの再計算は元のproblem.answer
 * と一致する（バンク問題もこの一致をフィクスチャで担保済み）。
 * 高点法の勝ち解釈は切り上げ満貫の有無で不変のため、han/fu/yaku/fuDetailは変わらない。
 * problem.answer側の状態(前回の設定値等)に依存させず、常に再計算して一貫性を保つ。
 * 再スコアに失敗した場合（本来起こり得ないが防御的に）は元のproblemを返す。
 */
export function resolveAnswer(problem: Problem, roundUpMangan: boolean): Problem {
  const rescored = scoreHand(problemToScoreHandInput(problem), { roundUpMangan });
  if (!rescored) return problem;
  return { ...problem, answer: rescored };
}
