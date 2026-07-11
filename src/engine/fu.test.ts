import { describe, expect, it } from "vitest";
import {
  calculateFu,
  calculateFuBreakdown,
  calculateFuElements,
  chiitoitsuFuBreakdown,
  chiitoitsuFuElements,
  type FuContext,
} from "./fu";
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
    expect(labels).toContain("基本符");
    expect(labels).toContain("門前ロン");
    expect(labels).toContain("暗刻(幺九)");
    // 待ちのラベルにはふりがなを添える。
    expect(labels).toContain("待ち: 単騎(タンキ)");
  });

  it("aggregates identical melds into one item with a count and summed fu", () => {
    // 111m(暗刻,老頭) 999s(暗刻,老頭) 44p 22p... ではなく、中張の暗刻を2つ持つ手で検証。
    // 222m(暗刻,中張) 888s(暗刻,中張) 456p 33z(非役牌雀頭) + 2m単騎? ここでは単純に
    // 222m 888s 456p 789p 55m の形（暗刻2つ＋順子2つ＋雀頭）を作る。
    const counts = countsFromCompact("222m888s456p789p55m");
    const winType = tileToType(parseTileNotation("5m")); // 雀頭シャンポンではなく単騎相当
    const [interp] = buildStandardInterpretations(counts, 4, [], winType, "tsumo");
    const breakdown = calculateFuBreakdown(interp, baseCtx({ winType: "tsumo" }));

    const ankouChuchan = breakdown.items.find((i) => i.label === "暗刻(中張)");
    expect(ankouChuchan).toBeDefined();
    expect(ankouChuchan?.count).toBe(2);
    expect(ankouChuchan?.fu).toBe(8); // 中張暗刻4符 × 2
    // 集約しても合計は各要素の和と一致する。
    expect(breakdown.items.reduce((s, i) => s + i.fu, 0)).toBe(breakdown.subtotal);
  });

  it("omits +0 fu waits (両面・双碰) from the breakdown", () => {
    // 平和にならない両面待ち: 役牌雀頭で両面。222m(暗刻) を含め両面ロン。
    const counts = countsFromCompact("234m567p345s222m");
    counts[31] += 2; // 白(役牌)雀頭 index 31
    const winType = tileToType(parseTileNotation("2m")); // 234mの両面上がり
    const [interp] = buildStandardInterpretations(counts, 4, [], winType, "ron");
    const breakdown = calculateFuBreakdown(interp, baseCtx({ winType: "ron" }));

    expect(breakdown.items.some((i) => i.label.startsWith("待ち"))).toBe(false);
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

  it("counts a concealed kan (暗槓) at its full fu value", () => {
    // 1m暗槓(老頭暗槓32符) 456p 789s 234s + 5z雀頭(白,役牌)単騎ロン
    // 20(副底)+10(門前ロン)+32(老頭暗槓)+2(役牌雀頭)+2(単騎) = 66 -> 70符
    const counts = countsFromCompact("456p789s234s5z5z");
    const winType = tileToType(parseTileNotation("5z"));
    const [interp] = buildStandardInterpretations(
      counts,
      3,
      [{ type: "ankan", tiles: ["1m", "1m", "1m", "1m"].map(parseTileNotation) }],
      winType,
      "ron",
    );
    const breakdown = calculateFuBreakdown(interp, baseCtx({ winType: "ron" }));

    expect(breakdown.items.map((i) => i.label)).toContain("暗槓(幺九)");
    expect(breakdown.subtotal).toBe(66);
    expect(breakdown.total).toBe(70);
  });
});

describe("calculateFuBreakdown - includeZeroFu (符計算モードの全内訳)", () => {
  // 234m(順子) 567p(順子) 345s(順子) 222m(中張暗刻) + 99p(非役牌雀頭)、両面ロン。
  // 20(基本)+10(門前ロン)+4(中張暗刻)=34 -> 40符。順子・雀頭・待ちは全て+0符。
  function build() {
    const counts = countsFromCompact("234m567p345s222m");
    counts[9 + 8] += 2; // 99p(非役牌)雀頭
    const winType = tileToType(parseTileNotation("2m")); // 234mの両面上がり
    const [interp] = buildStandardInterpretations(counts, 4, [], winType, "ron");
    const ctx = baseCtx({ winType: "ron" });
    return { interp, ctx };
  }

  it("includes a 0符 (非役牌) pair as 雀頭 and a 0符 wait", () => {
    const { interp, ctx } = build();
    const breakdown = calculateFuBreakdown(interp, ctx, { includeZeroFu: true });
    const pair = breakdown.items.find((i) => i.label === "雀頭");
    expect(pair).toBeDefined();
    expect(pair?.fu).toBe(0);
    const wait = breakdown.items.find((i) => i.label.startsWith("待ち"));
    expect(wait).toBeDefined();
    expect(wait?.fu).toBe(0);
  });

  it("does NOT list 0符 sequences (順子) even with includeZeroFu", () => {
    // 順子は内訳に出さない（要件により除外）。
    const { interp, ctx } = build();
    const breakdown = calculateFuBreakdown(interp, ctx, { includeZeroFu: true });
    expect(breakdown.items.some((i) => i.label === "順子")).toBe(false);
  });

  it("shows open-hand ron as ロン(鳴き) 0符 (includeZeroFu)", () => {
    // 234m 456m 567p 345s + 99p(非役牌雀頭)。全順子・両面・非門前ロン(喰い平和形)。
    const counts = countsFromCompact("234m456m567p345s");
    counts[9 + 8] += 2; // 99p雀頭
    const winType = tileToType(parseTileNotation("6m"));
    const [interp] = buildStandardInterpretations(counts, 4, [], winType, "ron");
    const breakdown = calculateFuBreakdown(interp, baseCtx({ winType: "ron", isMenzen: false }), {
      includeZeroFu: true,
    });
    const ron = breakdown.items.find((i) => i.label === "ロン(鳴き)");
    expect(ron).toBeDefined();
    expect(ron?.fu).toBe(0);
    expect(breakdown.items.some((i) => i.label === "門前ロン")).toBe(false);
    // 喰い平和形の20符→30符切り上げは維持。
    expect(breakdown.subtotal).toBe(20);
    expect(breakdown.total).toBe(30);
  });

  it("still omits 0符 elements by default", () => {
    const { interp, ctx } = build();
    const breakdown = calculateFuBreakdown(interp, ctx);
    expect(breakdown.items.some((i) => i.label === "順子")).toBe(false);
    expect(breakdown.items.some((i) => i.label === "雀頭")).toBe(false);
    expect(breakdown.items.some((i) => i.label.startsWith("待ち"))).toBe(false);
  });

  it("does not change subtotal/total (0符要素は合計に影響しない)", () => {
    const { interp, ctx } = build();
    const def = calculateFuBreakdown(interp, ctx);
    const withZero = calculateFuBreakdown(interp, ctx, { includeZeroFu: true });
    expect(withZero.subtotal).toBe(def.subtotal);
    expect(withZero.total).toBe(def.total);
    expect(withZero.total).toBe(40);
    // 各要素の合計は依然 subtotal と一致する。
    expect(withZero.items.reduce((s, i) => s + i.fu, 0)).toBe(withZero.subtotal);
  });

  it("keeps 固定符(平和) as a single line even with includeZeroFu", () => {
    // 平和ツモは固定20符。全て0符要素だが分解せず1行を維持する。
    const counts = countsFromCompact("234m567p33z345s789m");
    const winType = tileToType(parseTileNotation("9m"));
    const [interp] = buildStandardInterpretations(counts, 4, [], winType, "tsumo");
    const breakdown = calculateFuBreakdown(interp, baseCtx({ winType: "tsumo" }), {
      includeZeroFu: true,
    });
    expect(breakdown.fixed).toBe(true);
    expect(breakdown.items).toHaveLength(1);
    expect(breakdown.total).toBe(20);
  });
});

describe("chiitoitsuFuBreakdown", () => {
  it("is a fixed 25 fu single item", () => {
    const breakdown = chiitoitsuFuBreakdown();
    expect(breakdown.total).toBe(25);
    expect(breakdown.subtotal).toBe(25);
    expect(breakdown.fixed).toBe(true);
    expect(breakdown.items).toHaveLength(1);
    expect(breakdown.items[0].fu).toBe(25);
  });
});

describe("calculateFuElements - 符分解モードの要素別内訳 (SPEC.md §4.10)", () => {
  it("pinfu tsumo is a fixed 20 fu element (not decomposed)", () => {
    const counts = countsFromCompact("234m567p33z345s789m");
    const winType = tileToType(parseTileNotation("9m"));
    const [interp] = buildStandardInterpretations(counts, 4, [], winType, "tsumo");
    const elements = calculateFuElements(interp, baseCtx({ winType: "tsumo" }));
    expect(elements).toEqual({ kind: "fixed", fu: 20 });
  });

  it("pinfu ron decomposes as standard (winMethod=10, others 0, total 30)", () => {
    const counts = countsFromCompact("234m567p33z345s789m");
    const winType = tileToType(parseTileNotation("9m"));
    const [interp] = buildStandardInterpretations(counts, 4, [], winType, "ron");
    const elements = calculateFuElements(interp, baseCtx({ winType: "ron" }));
    expect(elements).toEqual({
      kind: "standard",
      winMethod: 10,
      meldTotal: 0,
      pair: 0,
      wait: 0,
      subtotal: 30,
      total: 30,
    });
  });

  it("menzen ron + terminal ankou + tanki: winMethod=10, meldTotal=8, wait=2, total=40", () => {
    // 20(副底)+10(門前ロン)+8(老頭暗刻)+2(単騎) = 40（calculateFuBreakdownの既存テストと同一手）
    const counts = countsFromCompact("111m456p789s234s4z4z");
    const winType = tileToType(parseTileNotation("4z"));
    const [interp] = buildStandardInterpretations(counts, 4, [], winType, "ron");
    const elements = calculateFuElements(interp, baseCtx({ winType: "ron" }));
    expect(elements).toEqual({
      kind: "standard",
      winMethod: 10,
      meldTotal: 8,
      pair: 0,
      wait: 2,
      subtotal: 40,
      total: 40,
    });
  });

  it("tsumo + yakuhai pair + kanchan wait rounds up to 30 (pair=2)", () => {
    const counts = countsFromCompact("123p456p789s46m5m");
    counts[27] += 2; // 雀頭は東(自風=場風=east)を2枚追加
    const winType = tileToType(parseTileNotation("5m"));
    const [interp] = buildStandardInterpretations(counts, 4, [], winType, "tsumo");
    const elements = calculateFuElements(interp, baseCtx({ winType: "tsumo" }));
    expect(elements).toEqual({
      kind: "standard",
      winMethod: 2,
      meldTotal: 0,
      pair: 2,
      wait: 2,
      subtotal: 26,
      total: 30,
    });
  });

  it("open hand ryanmen ron (kuipinfu) bumps 20 -> 30 with a note", () => {
    const counts = countsFromCompact("234m456m567p345s");
    counts[9 + 8] += 2; // 9p雀頭(非役牌)
    const winType = tileToType(parseTileNotation("6m"));
    const [interp] = buildStandardInterpretations(counts, 4, [], winType, "ron");
    const elements = calculateFuElements(interp, baseCtx({ winType: "ron", isMenzen: false }));
    expect(elements).toEqual({
      kind: "standard",
      winMethod: 0,
      meldTotal: 0,
      pair: 0,
      wait: 0,
      subtotal: 20,
      total: 30,
      note: "喰い平和形のため30符に切り上げ",
    });
  });

  it("counts a concealed kan (暗槓) in meldTotal at its full fu value", () => {
    // 20(副底)+10(門前ロン)+32(老頭暗槓)+2(役牌雀頭)+2(単騎) = 66 -> 70符
    const counts = countsFromCompact("456p789s234s5z5z");
    const winType = tileToType(parseTileNotation("5z"));
    const [interp] = buildStandardInterpretations(
      counts,
      3,
      [{ type: "ankan", tiles: ["1m", "1m", "1m", "1m"].map(parseTileNotation) }],
      winType,
      "ron",
    );
    const elements = calculateFuElements(interp, baseCtx({ winType: "ron" }));
    expect(elements).toEqual({
      kind: "standard",
      winMethod: 10,
      meldTotal: 32,
      pair: 2,
      wait: 2,
      subtotal: 66,
      total: 70,
    });
  });

  it("matches calculateFuBreakdown's total for the same hand", () => {
    const counts = countsFromCompact("222m888s456p789p55m");
    const winType = tileToType(parseTileNotation("5m"));
    const ctx = baseCtx({ winType: "tsumo" });
    const [interp] = buildStandardInterpretations(counts, 4, [], winType, "tsumo");
    const elements = calculateFuElements(interp, ctx);
    const breakdown = calculateFuBreakdown(interp, ctx);
    expect(elements.kind === "standard" ? elements.total : elements.fu).toBe(breakdown.total);
  });
});

describe("chiitoitsuFuElements", () => {
  it("is a fixed 25 fu element", () => {
    expect(chiitoitsuFuElements()).toEqual({ kind: "fixed", fu: 25 });
  });
});
