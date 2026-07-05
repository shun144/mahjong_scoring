import { describe, expect, it } from "vitest";
import type { ScoreResult } from "../engine/score";
import { formatCalculationLine, formatPayment } from "./format";

describe("formatPayment", () => {
  it("formats ron as a single value", () => {
    expect(formatPayment({ kind: "ron", total: 8000 })).toBe("8000");
  });

  it("formats tsumo-oya as an 'all' value", () => {
    expect(formatPayment({ kind: "tsumo-oya", each: 4000 })).toBe("4000オール");
  });

  it("formats tsumo-ko as a child/parent split", () => {
    expect(formatPayment({ kind: "tsumo-ko", nonDealer: 2000, dealer: 4000 })).toBe(
      "2000 / 4000",
    );
  });
});

describe("formatCalculationLine", () => {
  it("matches the SPEC.md example: 40符3翻 (子ロン) → 5200", () => {
    const answer: ScoreResult = {
      yaku: [{ name: "役牌(白)", han: 1 }],
      han: 3,
      fu: 40,
      payment: { kind: "ron", total: 5200 },
    };
    expect(formatCalculationLine(answer, false, "ron")).toBe("40符3翻 (子ロン) → 5200");
  });

  it("shows the rank name instead of fu for mangan and above", () => {
    const answer: ScoreResult = {
      yaku: [{ name: "リーチ", han: 1 }],
      han: 5,
      fu: 30,
      payment: { kind: "ron", total: 12000 },
      rank: "mangan",
    };
    expect(formatCalculationLine(answer, true, "ron")).toBe("5翻 満貫 (親ロン) → 12000");
  });

  it("shows 役満 without a fu value for yakuman", () => {
    const answer: ScoreResult = {
      yaku: [{ name: "国士無双", han: 13 }],
      han: 13,
      fu: 0,
      payment: { kind: "ron", total: 32000 },
      rank: "yakuman",
    };
    expect(formatCalculationLine(answer, false, "ron")).toBe("13翻 役満 (子ロン) → 32000");
  });

  it("formats tsumo lines with the payment split", () => {
    const answer: ScoreResult = {
      yaku: [{ name: "平和", han: 1 }],
      han: 2,
      fu: 30,
      payment: { kind: "tsumo-ko", nonDealer: 500, dealer: 1000 },
    };
    expect(formatCalculationLine(answer, false, "tsumo")).toBe("30符2翻 (子ツモ) → 500 / 1000");
  });
});
