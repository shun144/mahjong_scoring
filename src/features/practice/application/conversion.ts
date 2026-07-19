import type { WinType } from "../../../engine/model";
import { calculatePayment, determineRank, type Payment } from "../../../engine/score";
import { generateChoices } from "./distractors";
import { chance, pickOne, type RandomSource } from "./random";

/** 点数換算モードの1セル（符・翻・ツモ/ロン）。 */
export interface ConversionCell {
  fu: number;
  han: number;
  winType: WinType;
}

/**
 * 候補セルの元データ（実在性制約のみを反映。SPEC.md §4.9）。
 * 標準ルールで既に満貫となるセル（40符以上×4翻・70符×3翻以上）は候補から除外済み。
 * `30符4翻`・`60符3翻`（基本点1920）は標準ルールでは満貫未満のため候補に含め、
 * 切り上げ満貫設定の反映は `eligibleCells` で動的に行う。
 */
const CANDIDATE_FU_HAN: readonly {
  fu: number;
  hanList: readonly number[];
  winTypes: readonly WinType[];
}[] = [
  { fu: 20, hanList: [2, 3, 4], winTypes: ["tsumo"] },
  { fu: 25, hanList: [2, 3, 4], winTypes: ["ron", "tsumo"] },
  { fu: 30, hanList: [1, 2, 3, 4], winTypes: ["ron", "tsumo"] },
  { fu: 40, hanList: [1, 2, 3], winTypes: ["ron", "tsumo"] },
  { fu: 50, hanList: [1, 2, 3], winTypes: ["ron", "tsumo"] },
  { fu: 60, hanList: [1, 2, 3], winTypes: ["ron", "tsumo"] },
  { fu: 70, hanList: [1, 2], winTypes: ["ron", "tsumo"] },
];

function allCandidateCells(): ConversionCell[] {
  const cells: ConversionCell[] = [];
  for (const { fu, hanList, winTypes } of CANDIDATE_FU_HAN) {
    for (const han of hanList) {
      for (const winType of winTypes) {
        cells.push({ fu, han, winType });
      }
    }
  }
  return cells;
}

/**
 * 現在の切り上げ満貫設定のもとで満貫未満のセルのみを返す（SPEC.md §4.9）。
 * `roundUpMangan=true` のとき `30符4翻`・`60符3翻`（基本点1920）が満貫化し除外される。
 */
export function eligibleCells(roundUpMangan: boolean): ConversionCell[] {
  return allCandidateCells().filter(
    (cell) => determineRank(cell.han, cell.fu, { roundUpMangan }) === null,
  );
}

export interface ConversionQuestion {
  fu: number;
  han: number;
  isDealer: boolean;
  winType: WinType;
  answer: Payment;
}

/**
 * 点数換算モードの次のお題と4択を生成する。手牌は一切用いず、
 * `calculatePayment`（符・翻・親子・ツモ/ロン → 支払い）と `generateChoices`（誤答生成）のみで構成する。
 */
export function nextConversionQuestion(
  rng: RandomSource,
  roundUpMangan: boolean,
): { question: ConversionQuestion; choices: Payment[] } {
  const cell = pickOne(eligibleCells(roundUpMangan), rng);
  const isDealer = chance(0.5, rng);
  const { payment } = calculatePayment(cell.han, cell.fu, isDealer, cell.winType, {
    roundUpMangan,
  });
  const choices = generateChoices(
    payment,
    { han: cell.han, fu: cell.fu, isDealer, winType: cell.winType },
    rng,
  );
  return {
    question: { fu: cell.fu, han: cell.han, isDealer, winType: cell.winType, answer: payment },
    choices,
  };
}
