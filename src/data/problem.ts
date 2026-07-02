import type { Meld, Tile, Wind, WinType } from "../engine/model";
import type { ScoreHandInput } from "../engine/scoreHand";
import type { ScoreResult } from "../engine/score";

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
