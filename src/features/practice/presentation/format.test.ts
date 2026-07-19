import { describe, expect, it } from "vitest";
import type { ScoreResult } from "../../../engine/score";
import type { ConversionQuestion } from "../application/conversion";
import {
  conversionFormulaParts,
  formatCalculationLine,
  formatConversionFormula,
  formatPayment,
} from "./format";

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

describe("conversionFormulaParts / formatConversionFormula", () => {
  it("子ロン・丸めなし（SPEC.md §4.9 例: 50符1翻）", () => {
    const question: ConversionQuestion = {
      fu: 50,
      han: 1,
      isDealer: false,
      winType: "ron",
      answer: { kind: "ron", total: 1600 },
    };
    const parts = conversionFormulaParts(question);
    expect(parts.multiplierLabel).toBe("×4(子ロン)");
    expect(parts.product).toBe(1600);
    expect(parts.rounded).toBe(false);
    expect(formatConversionFormula(question)).toBe("50符 × 2^(2+1翻) ×4(子ロン) = 1600");
  });

  it("子ロン・丸めあり（積と最終額が異なる場合は積→点数を示す）", () => {
    const question: ConversionQuestion = {
      fu: 30,
      han: 1,
      isDealer: false,
      winType: "ron",
      answer: { kind: "ron", total: 1000 },
    };
    const parts = conversionFormulaParts(question);
    expect(parts.product).toBe(960);
    expect(parts.rounded).toBe(true);
    expect(formatConversionFormula(question)).toBe(
      "30符 × 2^(2+1翻) ×4(子ロン) = 960 → 1000",
    );
  });

  it("親ツモ・丸めあり", () => {
    const question: ConversionQuestion = {
      fu: 40,
      han: 3,
      isDealer: true,
      winType: "tsumo",
      answer: { kind: "tsumo-oya", each: 2600 },
    };
    const parts = conversionFormulaParts(question);
    expect(parts.multiplierLabel).toBe("×2(親ツモ)");
    expect(parts.product).toBe(2560);
    expect(parts.rounded).toBe(true);
    expect(formatConversionFormula(question)).toBe(
      "40符 × 2^(2+3翻) ×2(親ツモ) = 2560 → 2600オール",
    );
  });

  it("子ツモは分数(1/2)を使わず「子/親」の内訳で示す", () => {
    const question: ConversionQuestion = {
      fu: 50,
      han: 2,
      isDealer: false,
      winType: "tsumo",
      answer: { kind: "tsumo-ko", nonDealer: 800, dealer: 1600 },
    };
    const parts = conversionFormulaParts(question);
    expect(parts.multiplierLabel).toBe("(子ツモ)");
    expect(parts.product).toBe(800);
    expect(parts.rounded).toBe(true); // 子/親の内訳を必ず矢印で示すため常に真
    const text = formatConversionFormula(question);
    expect(text).toBe("50符 × 2^(2+2翻) (子ツモ) = 800 → 800 / 1600");
    expect(text).not.toContain("1/2");
  });

  it("子ツモ・丸めあり", () => {
    const question: ConversionQuestion = {
      fu: 30,
      han: 1,
      isDealer: false,
      winType: "tsumo",
      answer: { kind: "tsumo-ko", nonDealer: 300, dealer: 500 },
    };
    expect(formatConversionFormula(question)).toBe(
      "30符 × 2^(2+1翻) (子ツモ) = 240 → 300 / 500",
    );
  });
});
