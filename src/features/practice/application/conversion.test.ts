import { describe, expect, it } from "vitest";
import { calculatePayment, determineRank } from "@/core/scoring/domain/scoreService";
import { eligibleCells, nextConversionQuestion } from "./conversion";
import { paymentKey } from "./distractors";
import { createSeededRandom } from "./random";

describe("eligibleCells", () => {
  it("すべての候補セルが roundUpMangan=false のもとで満貫未満である", () => {
    for (const cell of eligibleCells(false)) {
      expect(determineRank(cell.han, cell.fu, { roundUpMangan: false })).toBeNull();
    }
  });

  it("roundUpMangan=false では 30符4翻・60符3翻 を含む（境界セル）", () => {
    const cells = eligibleCells(false);
    expect(cells.some((c) => c.fu === 30 && c.han === 4)).toBe(true);
    expect(cells.some((c) => c.fu === 60 && c.han === 3)).toBe(true);
  });

  it("roundUpMangan=true では 30符4翻・60符3翻 が満貫化し除外される", () => {
    const cells = eligibleCells(true);
    expect(cells.some((c) => c.fu === 30 && c.han === 4)).toBe(false);
    expect(cells.some((c) => c.fu === 60 && c.han === 3)).toBe(false);
    for (const cell of cells) {
      expect(determineRank(cell.han, cell.fu, { roundUpMangan: true })).toBeNull();
    }
  });

  it("20符はツモのみ、2翻以上のセルだけを含む", () => {
    const cells = eligibleCells(false).filter((c) => c.fu === 20);
    expect(cells.length).toBeGreaterThan(0);
    expect(cells.every((c) => c.winType === "tsumo")).toBe(true);
    expect(cells.every((c) => c.han >= 2)).toBe(true);
  });

  it("25符は2翻以上のセルだけを含む（七対子）", () => {
    const cells = eligibleCells(false).filter((c) => c.fu === 25);
    expect(cells.length).toBeGreaterThan(0);
    expect(cells.every((c) => c.han >= 2)).toBe(true);
  });
});

describe("nextConversionQuestion", () => {
  it("answer が calculatePayment(..., { roundUpMangan }) と一致する", () => {
    const rng = createSeededRandom(1);
    for (let i = 0; i < 30; i++) {
      const roundUpMangan = i % 2 === 0;
      const { question } = nextConversionQuestion(rng, roundUpMangan);
      const expected = calculatePayment(
        question.han,
        question.fu,
        question.isDealer,
        question.winType,
        { roundUpMangan },
      ).payment;
      expect(paymentKey(question.answer)).toBe(paymentKey(expected));
    }
  });

  it("choices は正解を含む4件で、正解と同じ支払い形式に揃っている", () => {
    const rng = createSeededRandom(2);
    for (let i = 0; i < 30; i++) {
      const { question, choices } = nextConversionQuestion(rng, i % 2 === 0);
      expect(choices.length).toBe(4);
      expect(choices.some((c) => paymentKey(c) === paymentKey(question.answer))).toBe(true);
      expect(choices.every((c) => c.kind === question.answer.kind)).toBe(true);
      const keys = new Set(choices.map(paymentKey));
      expect(keys.size).toBe(4);
    }
  });

  it("roundUpMangan=true では境界セル（30符4翻・60符3翻）が出題されない", () => {
    const rng = createSeededRandom(3);
    for (let i = 0; i < 100; i++) {
      const { question } = nextConversionQuestion(rng, true);
      const isBoundary =
        (question.fu === 30 && question.han === 4) || (question.fu === 60 && question.han === 3);
      expect(isBoundary).toBe(false);
    }
  });
});
