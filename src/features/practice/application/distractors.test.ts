import { describe, expect, it } from "vitest";
import type { FuBreakdown } from "../../../engine/fu";
import { calculatePayment, type Payment } from "../../../engine/score";
import { generateChoices, generateFuChoices, type DistractorContext } from "./distractors";
import { createSeededRandom } from "./random";

function paymentKey(payment: Payment): string {
  if (payment.kind === "ron") return `ron:${payment.total}`;
  if (payment.kind === "tsumo-oya") return `tsumo-oya:${payment.each}`;
  return `tsumo-ko:${payment.nonDealer}:${payment.dealer}`;
}

describe("generateChoices", () => {
  it("always includes the correct answer", () => {
    const rng = createSeededRandom(1);
    const ctx: DistractorContext = { han: 3, fu: 30, isDealer: false, winType: "ron" };
    const { payment: correct } = calculatePayment(ctx.han, ctx.fu, ctx.isDealer, ctx.winType);
    const choices = generateChoices(correct, ctx, rng);
    expect(choices.some((c) => paymentKey(c) === paymentKey(correct))).toBe(true);
  });

  it("produces exactly 4 choices", () => {
    const rng = createSeededRandom(2);
    for (let i = 0; i < 50; i++) {
      const han = 1 + Math.floor(rng() * 6);
      const fu = [20, 25, 30, 40][Math.floor(rng() * 4)];
      const isDealer = rng() < 0.5;
      const winType = rng() < 0.5 ? "ron" : "tsumo";
      const ctx: DistractorContext = { han, fu, isDealer, winType };
      const { payment: correct } = calculatePayment(han, fu, isDealer, winType);
      const choices = generateChoices(correct, ctx, rng);
      expect(choices.length).toBe(4);
    }
  });

  it("has no duplicate choices", () => {
    const rng = createSeededRandom(3);
    const ctx: DistractorContext = { han: 4, fu: 30, isDealer: true, winType: "tsumo" };
    const { payment: correct } = calculatePayment(ctx.han, ctx.fu, ctx.isDealer, ctx.winType);
    const choices = generateChoices(correct, ctx, rng);
    const keys = choices.map(paymentKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("all choices share the same payment shape as the correct answer", () => {
    const rng = createSeededRandom(4);
    const scenarios: DistractorContext[] = [
      { han: 2, fu: 30, isDealer: false, winType: "ron" },
      { han: 3, fu: 30, isDealer: false, winType: "tsumo" },
      { han: 3, fu: 30, isDealer: true, winType: "tsumo" },
      { han: 5, fu: 25, isDealer: false, winType: "ron" }, // 七対子相当(符固定)
    ];
    for (const ctx of scenarios) {
      const { payment: correct } = calculatePayment(ctx.han, ctx.fu, ctx.isDealer, ctx.winType);
      const choices = generateChoices(correct, ctx, rng);
      for (const c of choices) {
        expect(c.kind).toBe(correct.kind);
      }
    }
  });

  it("tsumo-ko distractors keep the realistic dealer=2x non-dealer ratio", () => {
    const rng = createSeededRandom(5);
    const ctx: DistractorContext = { han: 3, fu: 30, isDealer: false, winType: "tsumo" };
    const { payment: correct } = calculatePayment(ctx.han, ctx.fu, ctx.isDealer, ctx.winType);
    const choices = generateChoices(correct, ctx, rng);
    for (const c of choices) {
      if (c.kind === "tsumo-ko") {
        expect(c.dealer).toBe(c.nonDealer * 2);
      }
    }
  });

  it("never offers a non-existent score (all choices are real payments of the correct kind)", () => {
    // 正解と同じ表示形式で実在する点数のキー集合を、翻×符の総当りから作る。
    const buildRealKeys = (kind: Payment["kind"], isDealer: boolean): Set<string> => {
      const winType = kind === "ron" ? "ron" : "tsumo";
      const dealer = kind === "tsumo-oya" ? true : kind === "tsumo-ko" ? false : isDealer;
      const fuList =
        winType === "ron"
          ? [25, 30, 40, 50, 60, 70, 80, 90, 100, 110]
          : [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110];
      const keys = new Set<string>();
      for (let han = 1; han <= 13; han++) {
        for (const fu of fuList) {
          keys.add(paymentKey(calculatePayment(han, fu, dealer, winType).payment));
        }
      }
      return keys;
    };

    const rng = createSeededRandom(777);
    for (let i = 0; i < 200; i++) {
      const han = 1 + Math.floor(rng() * 6);
      const isDealer = rng() < 0.5;
      const winType = rng() < 0.5 ? "ron" : "tsumo";
      // ロンに20符は実在しないため、winType に応じて実在する符から選ぶ。
      const fuChoices = winType === "ron" ? [25, 30, 40, 50, 60] : [20, 25, 30, 40, 50, 60];
      const fu = fuChoices[Math.floor(rng() * fuChoices.length)];
      const ctx: DistractorContext = { han, fu, isDealer, winType };
      const { payment: correct } = calculatePayment(han, fu, isDealer, winType);
      const realKeys = buildRealKeys(correct.kind, isDealer);
      const choices = generateChoices(correct, ctx, rng);
      for (const c of choices) {
        expect(realKeys.has(paymentKey(c))).toBe(true);
      }
    }
  });

  it("is deterministic for a given seed", () => {
    const ctx: DistractorContext = { han: 3, fu: 40, isDealer: false, winType: "ron" };
    const { payment: correct } = calculatePayment(ctx.han, ctx.fu, ctx.isDealer, ctx.winType);
    const a = generateChoices(correct, ctx, createSeededRandom(99));
    const b = generateChoices(correct, ctx, createSeededRandom(99));
    expect(a).toEqual(b);
  });

  it("gracefully degrades when few distinct distractors are possible (low han)", () => {
    const rng = createSeededRandom(6);
    const ctx: DistractorContext = { han: 1, fu: 30, isDealer: false, winType: "ron" };
    const { payment: correct } = calculatePayment(ctx.han, ctx.fu, ctx.isDealer, ctx.winType);
    const choices = generateChoices(correct, ctx, rng);
    expect(choices.length).toBeGreaterThanOrEqual(2); // 少なくとも正解+1つは出せる
    expect(choices.some((c) => paymentKey(c) === paymentKey(correct))).toBe(true);
  });
});

describe("generateFuChoices", () => {
  // 30符（切り上げあり: subtotal 26 -> total 30）の内訳。
  const fu30: FuBreakdown = {
    items: [{ label: "基本符", fu: 20 }],
    subtotal: 26,
    total: 30,
    fixed: false,
  };
  // 七対子25符（固定）の内訳。
  const fu25: FuBreakdown = {
    items: [{ label: "七対子(固定)", fu: 25 }],
    subtotal: 25,
    total: 25,
    fixed: true,
  };

  it("always includes the correct fu", () => {
    const rng = createSeededRandom(1);
    const choices = generateFuChoices(fu30, rng);
    expect(choices).toContain(30);
  });

  it("produces exactly 4 distinct choices", () => {
    const rng = createSeededRandom(2);
    const choices = generateFuChoices(fu30, rng);
    expect(choices.length).toBe(4);
    expect(new Set(choices).size).toBe(choices.length);
  });

  it("offers the pre-rounding value (切り上げ忘れ) as a candidate distractor", () => {
    // subtotal 26 は誤答候補の一つ。シャッフルで常に選ばれるとは限らないため、
    // 複数シードで少なくとも一度は出現することを確認する（シードは広く散らす）。
    const appeared = Array.from({ length: 40 }, (_, i) =>
      generateFuChoices(fu30, createSeededRandom((i + 1) * 104729)),
    ).some((choices) => choices.includes(26));
    expect(appeared).toBe(true);
  });

  it("handles the fixed 25 fu (七対子) case with plausible near-values", () => {
    const rng = createSeededRandom(4);
    const choices = generateFuChoices(fu25, rng);
    expect(choices).toContain(25);
    expect(choices.length).toBe(4);
    expect(new Set(choices).size).toBe(choices.length);
    // すべて妥当な符（20以上）である。
    for (const fu of choices) expect(fu).toBeGreaterThanOrEqual(20);
  });

  it("is deterministic for a given seed", () => {
    const a = generateFuChoices(fu30, createSeededRandom(42));
    const b = generateFuChoices(fu30, createSeededRandom(42));
    expect(a).toEqual(b);
  });
});
