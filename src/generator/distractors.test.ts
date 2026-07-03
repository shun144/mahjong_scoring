import { describe, expect, it } from "vitest";
import { calculatePayment, type Payment } from "../engine/score";
import { generateChoices, type DistractorContext } from "./distractors";
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
