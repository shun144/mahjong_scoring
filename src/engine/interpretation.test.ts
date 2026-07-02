import { describe, expect, it } from "vitest";
import { buildStandardInterpretations } from "./interpretation";
import { tileToType, tilesToCounts } from "./tileType";
import { parseTileNotation } from "./tiles";

function countsFromCompact(compact: string): number[] {
  const parts = compact.match(/\d+[mpsz]/g) ?? [];
  const notations: string[] = [];
  for (const part of parts) {
    const suit = part[part.length - 1];
    for (const digit of part.slice(0, -1)) notations.push(`${digit}${suit}`);
  }
  return tilesToCounts(notations.map(parseTileNotation));
}

describe("buildStandardInterpretations - wait kinds", () => {
  it("detects ryanmen wait (two-sided)", () => {
    // 123m 456p 789s 22z + 4m5m waiting on 3m or 6m, win on 6m -> 456m sequence, win on high side, ryanmen
    const counts = countsFromCompact("123m456p789s22z456m");
    const winType = tileToType(parseTileNotation("6m"));
    const results = buildStandardInterpretations(counts, 4, [], winType, "ron");
    const winningSets = results.flatMap((r) => r.sets.filter((s) => s.isWinningGroup));
    expect(winningSets.some((s) => s.waitKind === "ryanmen")).toBe(true);
  });

  it("detects kanchan wait (closed/embedded)", () => {
    // 123m 456p 789s 22z + 4m6m waiting on 5m (kanchan)
    const counts = countsFromCompact("123m456p789s22z46m5m");
    const winType = tileToType(parseTileNotation("5m"));
    const results = buildStandardInterpretations(counts, 4, [], winType, "ron");
    const winningSets = results.flatMap((r) => r.sets.filter((s) => s.isWinningGroup));
    expect(winningSets.some((s) => s.waitKind === "kanchan")).toBe(true);
  });

  it("detects penchan wait (12 waiting on 3)", () => {
    const counts = countsFromCompact("456p789s22z12m3m456m");
    const winType = tileToType(parseTileNotation("3m"));
    const results = buildStandardInterpretations(counts, 4, [], winType, "ron");
    const winningSets = results.flatMap((r) => r.sets.filter((s) => s.isWinningGroup));
    expect(winningSets.some((s) => s.waitKind === "penchan")).toBe(true);
  });

  it("detects penchan wait (89 waiting on 7)", () => {
    const counts = countsFromCompact("456p123s22z789m123m");
    const winType = tileToType(parseTileNotation("7m"));
    const results = buildStandardInterpretations(counts, 4, [], winType, "ron");
    const winningSets = results.flatMap((r) => r.sets.filter((s) => s.isWinningGroup));
    expect(winningSets.some((s) => s.waitKind === "penchan")).toBe(true);
  });

  it("detects shanpon wait (dual pair -> triplet)", () => {
    // 123m 456p 789s + 22z 33z, win on 2z -> 222z triplet, shanpon
    const counts = countsFromCompact("123m456p789s22z33z2z");
    const winType = tileToType(parseTileNotation("2z"));
    const results = buildStandardInterpretations(counts, 4, [], winType, "ron");
    const winningSets = results.flatMap((r) => r.sets.filter((s) => s.isWinningGroup));
    expect(winningSets.some((s) => s.waitKind === "shanpon")).toBe(true);
  });

  it("detects tanki wait (single tile pair completion)", () => {
    const counts = countsFromCompact("123m456p789s123s5z5z");
    const winType = tileToType(parseTileNotation("5z"));
    const results = buildStandardInterpretations(counts, 4, [], winType, "ron");
    expect(results.some((r) => r.pair.isWinningGroup)).toBe(true);
  });
});

describe("buildStandardInterpretations - ron triplet concealment exception", () => {
  it("marks the winning triplet as open (concealed=false) on ron", () => {
    // shanpon win by ron: 222z triplet completed by ron counts as open for fu
    const counts = countsFromCompact("123m456p789s22z33z2z");
    const winType = tileToType(parseTileNotation("2z"));
    const results = buildStandardInterpretations(counts, 4, [], winType, "ron");
    const shanponResult = results.find((r) =>
      r.sets.some((s) => s.isWinningGroup && s.waitKind === "shanpon"),
    );
    const winningTriplet = shanponResult?.sets.find((s) => s.isWinningGroup);
    expect(winningTriplet?.concealed).toBe(false);
  });

  it("keeps the winning triplet concealed (ankou) on tsumo", () => {
    const counts = countsFromCompact("123m456p789s22z33z2z");
    const winType = tileToType(parseTileNotation("2z"));
    const results = buildStandardInterpretations(counts, 4, [], winType, "tsumo");
    const shanponResult = results.find((r) =>
      r.sets.some((s) => s.isWinningGroup && s.waitKind === "shanpon"),
    );
    const winningTriplet = shanponResult?.sets.find((s) => s.isWinningGroup);
    expect(winningTriplet?.concealed).toBe(true);
  });

  it("does not affect other (non-winning) triplets' concealment", () => {
    // 111m triplet is pre-existing (not the winning group); shanpon win on 2z via ron
    const counts = countsFromCompact("111m456p789s22z33z2z");
    const winType = tileToType(parseTileNotation("2z"));
    const results = buildStandardInterpretations(counts, 4, [], winType, "ron");
    const shanponResult = results.find((r) =>
      r.sets.some((s) => s.isWinningGroup && s.waitKind === "shanpon"),
    );
    const otherTriplet = shanponResult?.sets.find(
      (s) => s.kind === "triplet" && !s.isWinningGroup,
    );
    expect(otherTriplet?.concealed).toBe(true);
  });
});
