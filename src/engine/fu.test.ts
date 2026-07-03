import { describe, expect, it } from "vitest";
import { calculateFu, calculateFuBreakdown, type FuContext } from "./fu";
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

const baseCtx = (overrides: Partial<FuContext>): FuContext => ({
  isMenzen: true,
  winType: "ron",
  seatWind: "east",
  roundWind: "east",
  ...overrides,
});

describe("calculateFu - pinfu", () => {
  it("pinfu tsumo is fixed at 20 fu", () => {
    // 234m 567p 33z(非役牌雀頭) 345s + 789m(上がり牌9mでryanmen)
    const counts = countsFromCompact("234m567p33z345s789m");
    const winType = tileToType(parseTileNotation("9m"));
    const [interp] = buildStandardInterpretations(counts, 4, [], winType, "tsumo");
    const fu = calculateFu(interp, baseCtx({ winType: "tsumo" }));
    expect(fu).toBe(20);
  });

  it("pinfu ron is fixed at 30 fu", () => {
    const counts = countsFromCompact("234m567p33z345s789m");
    const winType = tileToType(parseTileNotation("9m"));
    const [interp] = buildStandardInterpretations(counts, 4, [], winType, "ron");
    const fu = calculateFu(interp, baseCtx({ winType: "ron" }));
    expect(fu).toBe(30);
  });
});

describe("calculateFu - standard combinations", () => {
  it("menzen ron + terminal ankou + tanki = 40 fu", () => {
    // 111m(暗刻,老頭) 456p 789s 234s + 4z(北,非役牌: 自風/場風=east)単騎
    const counts = countsFromCompact("111m456p789s234s4z4z");
    const winType = tileToType(parseTileNotation("4z"));
    const [interp] = buildStandardInterpretations(counts, 4, [], winType, "ron");
    // 20(副底)+10(門前ロン)+8(老頭暗刻)+2(単騎) = 40
    const fu = calculateFu(interp, baseCtx({ winType: "ron" }));
    expect(fu).toBe(40);
  });

  it("tsumo + yakuhai pair(seat wind) + kanchan wait rounds up to 30", () => {
    const counts = countsFromCompact("123p456p789s46m5m");
    counts[27] += 2; // 雀頭は東(自風=場風=east)を2枚追加
    const winType = tileToType(parseTileNotation("5m"));
    const [interp] = buildStandardInterpretations(counts, 4, [], winType, "tsumo");
    // 20(副底)+2(ツモ)+2(役牌雀頭)+2(嵌張) = 26 -> 30に切り上げ
    const fu = calculateFu(interp, baseCtx({ winType: "tsumo" }));
    expect(fu).toBe(30);
  });

  it("open hand ryanmen ron with no other fu elements is bumped to 30 (kuipinfu ron)", () => {
    // 234m 456m 567p 345s + 9p雀頭(非役牌)。全て順子・両面待ちだが非門前。
    const counts = countsFromCompact("234m456m567p345s");
    counts[9 + 8] += 2; // 9p雀頭 (index = 9+8=17)
    const winType = tileToType(parseTileNotation("6m"));
    const [interp] = buildStandardInterpretations(counts, 4, [], winType, "ron");
    const fu = calculateFu(interp, baseCtx({ winType: "ron", isMenzen: false }));
    expect(fu).toBe(30);
  });
});

describe("calculateFuBreakdown - itemised breakdown", () => {
  it("itemises menzen ron + terminal ankou + tanki and sums to the total", () => {
    // 20(副底)+10(門前ロン)+8(老頭暗刻)+2(単騎) = 40
    const counts = countsFromCompact("111m456p789s234s4z4z");
    const winType = tileToType(parseTileNotation("4z"));
    const [interp] = buildStandardInterpretations(counts, 4, [], winType, "ron");
    const breakdown = calculateFuBreakdown(interp, baseCtx({ winType: "ron" }));

    expect(breakdown.total).toBe(40);
    expect(breakdown.total).toBe(calculateFu(interp, baseCtx({ winType: "ron" })));
    expect(breakdown.subtotal).toBe(40);
    expect(breakdown.fixed).toBe(false);
    // 各要素の合計が subtotal と一致する
    expect(breakdown.items.reduce((s, i) => s + i.fu, 0)).toBe(breakdown.subtotal);
    const labels = breakdown.items.map((i) => i.label);
    expect(labels).toContain("副底");
    expect(labels).toContain("門前ロン");
    expect(labels).toContain("暗刻(幺九)");
    expect(labels).toContain("待ち: 単騎");
  });

  it("marks pinfu tsumo as a fixed 20 fu with a single item", () => {
    const counts = countsFromCompact("234m567p33z345s789m");
    const winType = tileToType(parseTileNotation("9m"));
    const [interp] = buildStandardInterpretations(counts, 4, [], winType, "tsumo");
    const breakdown = calculateFuBreakdown(interp, baseCtx({ winType: "tsumo" }));

    expect(breakdown.total).toBe(20);
    expect(breakdown.fixed).toBe(true);
    expect(breakdown.items).toHaveLength(1);
  });

  it("notes the kuipinfu ron bump to 30 fu", () => {
    const counts = countsFromCompact("234m456m567p345s");
    counts[9 + 8] += 2;
    const winType = tileToType(parseTileNotation("6m"));
    const [interp] = buildStandardInterpretations(counts, 4, [], winType, "ron");
    const breakdown = calculateFuBreakdown(interp, baseCtx({ winType: "ron", isMenzen: false }));

    expect(breakdown.subtotal).toBe(20);
    expect(breakdown.total).toBe(30);
    expect(breakdown.note).toBeTruthy();
  });
});
