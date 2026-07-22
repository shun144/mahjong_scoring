import { describe, expect, it } from "vitest";
import {
  countAkaDora,
  countDora,
  countDoraFromIndicators,
  doraFromIndicator,
  indicatorForDora,
} from "./doraService";
import { parseTileNotation } from "./tile";

describe("doraFromIndicator", () => {
  it("suited tiles: dora is the next number", () => {
    expect(doraFromIndicator(parseTileNotation("4s"))).toEqual({ suit: "s", rank: 5 });
    expect(doraFromIndicator(parseTileNotation("1m"))).toEqual({ suit: "m", rank: 2 });
    expect(doraFromIndicator(parseTileNotation("8p"))).toEqual({ suit: "p", rank: 9 });
  });

  it("suited tiles: 9 wraps around to 1", () => {
    expect(doraFromIndicator(parseTileNotation("9m"))).toEqual({ suit: "m", rank: 1 });
    expect(doraFromIndicator(parseTileNotation("9p"))).toEqual({ suit: "p", rank: 1 });
    expect(doraFromIndicator(parseTileNotation("9s"))).toEqual({ suit: "s", rank: 1 });
  });

  it("wind tiles cycle 東→南→西→北→東", () => {
    expect(doraFromIndicator(parseTileNotation("1z"))).toEqual({ suit: "z", rank: 2 }); // 東->南
    expect(doraFromIndicator(parseTileNotation("2z"))).toEqual({ suit: "z", rank: 3 }); // 南->西
    expect(doraFromIndicator(parseTileNotation("3z"))).toEqual({ suit: "z", rank: 4 }); // 西->北
    expect(doraFromIndicator(parseTileNotation("4z"))).toEqual({ suit: "z", rank: 1 }); // 北->東
  });

  it("dragon tiles cycle 白→發→中→白", () => {
    expect(doraFromIndicator(parseTileNotation("5z"))).toEqual({ suit: "z", rank: 6 }); // 白->發
    expect(doraFromIndicator(parseTileNotation("6z"))).toEqual({ suit: "z", rank: 7 }); // 發->中
    expect(doraFromIndicator(parseTileNotation("7z"))).toEqual({ suit: "z", rank: 5 }); // 中->白
  });

  it("does not mix the wind cycle and the dragon cycle", () => {
    // 北(4z)の次は東(1z)であって白(5z)ではない
    expect(doraFromIndicator(parseTileNotation("4z")).rank).not.toBe(5);
    // 中(7z)の次は白(5z)であって東(1z)ではない
    expect(doraFromIndicator(parseTileNotation("7z")).rank).not.toBe(1);
  });

  it("ignores the red flag of the indicator (indicators are not aka dora)", () => {
    expect(doraFromIndicator({ suit: "m", rank: 4, red: true })).toEqual({ suit: "m", rank: 5 });
  });
});

describe("countDora / countDoraFromIndicators", () => {
  it("counts direct dora matches in the hand", () => {
    const hand = [parseTileNotation("5s"), parseTileNotation("5s"), parseTileNotation("1m")];
    expect(countDora(hand, [parseTileNotation("5s")])).toBe(2);
  });

  it("counts dora derived from an indicator (4索 indicator -> 5索 is dora)", () => {
    const hand = [parseTileNotation("5s"), parseTileNotation("6s"), parseTileNotation("1m")];
    expect(countDoraFromIndicators(hand, [parseTileNotation("4s")])).toBe(1);
  });

  it("multiple indicators of the same value each multiply independently", () => {
    const hand = [parseTileNotation("5s")];
    expect(countDoraFromIndicators(hand, [parseTileNotation("4s"), parseTileNotation("4s")])).toBe(2);
  });

  it("returns 0 when no hand tile matches the derived dora", () => {
    const hand = [parseTileNotation("1m"), parseTileNotation("2m")];
    expect(countDoraFromIndicators(hand, [parseTileNotation("4s")])).toBe(0);
  });
});

describe("countAkaDora", () => {
  it("counts red-flagged tiles only", () => {
    const hand = [
      { suit: "m", rank: 5, red: true } as const,
      { suit: "p", rank: 5 } as const,
      { suit: "s", rank: 5, red: true } as const,
    ];
    expect(countAkaDora(hand)).toBe(2);
  });
});

describe("indicatorForDora (inverse of doraFromIndicator)", () => {
  it.each([
    "1m", "5m", "9m", "1p", "9p", "1s", "9s",
    "1z", "2z", "3z", "4z", "5z", "6z", "7z",
  ])("round-trips through doraFromIndicator for %s", (notation) => {
    const dora = parseTileNotation(notation);
    const indicator = indicatorForDora(dora);
    expect(doraFromIndicator(indicator)).toEqual(dora);
  });
});
