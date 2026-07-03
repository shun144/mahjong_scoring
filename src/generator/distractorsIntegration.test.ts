import { describe, expect, it } from "vitest";
import problemBankRaw from "../data/problemBank.json";
import type { Problem } from "../data/problem";
import { generateChoices } from "./distractors";
import { createSeededRandom } from "./random";

const problemBank = problemBankRaw as unknown as Problem[];

describe("generateChoices against the real problem bank", () => {
  it("produces valid 4-choice sets for every bank problem, always including the correct answer", () => {
    const rng = createSeededRandom(42);
    for (const p of problemBank) {
      const choices = generateChoices(
        p.answer.payment,
        {
          han: p.answer.han,
          fu: p.answer.fu,
          isDealer: p.conditions.isDealer,
          winType: p.hand.winType,
        },
        rng,
      );
      expect(choices.length).toBe(4);
      expect(choices).toContainEqual(p.answer.payment);
      for (const c of choices) {
        expect(c.kind).toBe(p.answer.payment.kind);
      }
    }
  });
});
