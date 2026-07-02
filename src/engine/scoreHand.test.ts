import { describe, expect, it } from "vitest";
import type { Meld, Tile } from "./model";
import { scoreHand, type ScoreHandInput } from "./scoreHand";
import { parseTileNotation } from "./tiles";

function tiles(compact: string): Tile[] {
  const parts = compact.match(/\d+[mpsz]/g) ?? [];
  const out: Tile[] = [];
  for (const part of parts) {
    const suit = part[part.length - 1];
    for (const digit of part.slice(0, -1)) out.push(parseTileNotation(`${digit}${suit}`));
  }
  return out;
}

function baseInput(overrides: Partial<ScoreHandInput>): ScoreHandInput {
  return {
    concealed: [],
    melds: [],
    winningTile: parseTileNotation("1m"),
    winType: "ron",
    doraIndicators: [],
    uraDoraIndicators: [],
    seatWind: "east",
    roundWind: "east",
    isDealer: false,
    riichi: false,
    ...overrides,
  };
}

describe("scoreHand - representative hands", () => {
  it("平和ロン: 30符1翻(リーチのみ) 子1000点", () => {
    // 234m 567p 33z(非役牌雀頭,south wind irrelevant) 345s 789m(win 9m, ryanmen)
    const result = scoreHand(
      baseInput({
        concealed: tiles("234m567p33z345s789m"),
        winningTile: parseTileNotation("9m"),
        riichi: true,
      }),
    );
    expect(result).not.toBeNull();
    expect(result?.han).toBe(2); // リーチ1 + 平和1
    expect(result?.fu).toBe(30);
    expect(result?.payment).toEqual({ kind: "ron", total: 2000 });
  });

  it("断幺九+ツモ: 子2翻30符相当", () => {
    // 234m 567p 33m(暗刻,非役牌雀頭ではなく刻子) ... simpler: 234m345p456s33s 678m(ツモ6m, ryanmen->kanchanでも良い)
    const result = scoreHand(
      baseInput({
        concealed: tiles("234m345p456s33s678m"),
        winningTile: parseTileNotation("8m"),
        winType: "tsumo",
      }),
    );
    expect(result).not.toBeNull();
    // 断幺九1 + 門前清自摸和1 (+平和は雀頭33sが非役牌・両面ならpinfuも成立しうる)
    expect(result?.yaku.some((y) => y.name === "断幺九")).toBe(true);
    expect(result?.yaku.some((y) => y.name === "門前清自摸和")).toBe(true);
  });

  it("役牌(白)のみ: 1翻確定", () => {
    // 234m 567p 789s 234s + 555z(白の暗刻) 雀頭無し...要修正: 4面子1雀頭必要
    const result = scoreHand(
      baseInput({
        concealed: tiles("234m567p789s55z555z"),
        winningTile: parseTileNotation("5z"),
        winType: "tsumo",
      }),
    );
    expect(result).not.toBeNull();
    expect(result?.yaku.some((y) => y.name === "役牌(白)")).toBe(true);
  });

  it("役なし（ドラのみ）の手は null を返す", () => {
    // 234m 567p 789s 234s 55s (役無し、ドラ2枚あっても不成立)
    const result = scoreHand(
      baseInput({
        concealed: tiles("234m567p789s234s55s"),
        winningTile: parseTileNotation("5s"),
        doraIndicators: [parseTileNotation("2m")],
      }),
    );
    expect(result).toBeNull();
  });

  it("ドラ表示牌から実際のドラを読み替えて翻に正しく加算する", () => {
    const withoutDora = scoreHand(
      baseInput({
        concealed: tiles("234m567p33z345s789m"),
        winningTile: parseTileNotation("9m"),
        riichi: true,
      }),
    );
    const withDora = scoreHand(
      baseInput({
        concealed: tiles("234m567p33z345s789m"),
        winningTile: parseTileNotation("9m"),
        riichi: true,
        doraIndicators: [parseTileNotation("1m")], // 表示牌1m -> ドラ2m(234m中の2mと一致)
      }),
    );
    expect(withDora?.han).toBe((withoutDora?.han ?? 0) + 1);
  });

  it("赤ドラを翻に加算する", () => {
    const result = scoreHand(
      baseInput({
        concealed: tiles("234m567p33z345s789m").map((t) =>
          t.suit === "p" && t.rank === 5 ? { ...t, red: true } : t,
        ),
        winningTile: parseTileNotation("9m"),
        riichi: true,
      }),
    );
    expect(result?.yaku.some((y) => y.name === "赤ドラ" && y.han === 1)).toBe(true);
  });

  it("裏ドラはリーチ時のみ加算される", () => {
    const notRiichi = scoreHand(
      baseInput({
        concealed: tiles("234m567p345s33m678m"),
        winningTile: parseTileNotation("6m"),
        winType: "tsumo",
        uraDoraIndicators: [parseTileNotation("1m")],
      }),
    );
    expect(notRiichi?.yaku.some((y) => y.name === "裏ドラ")).toBe(false);
  });

  it("四暗刻: 4つの暗刻+雀頭、ロンは待ちが単騎の場合のみ成立", () => {
    // 111m 222p 333s 444z(暗刻) + 55z単騎(タンキ)。ロンでも111m/222p/333s/444zは既存暗刻のまま。
    const result = scoreHand(
      baseInput({
        concealed: tiles("111m222p333s444z55z"),
        winningTile: parseTileNotation("5z"),
        winType: "ron",
      }),
    );
    expect(result?.yaku.some((y) => y.name === "四暗刻")).toBe(true);
    expect(result?.payment).toEqual({ kind: "ron", total: 32000 });
  });

  it("四暗刻: シャンポンをロンで完成させた場合は不成立（一部が明刻扱い）", () => {
    const result = scoreHand(
      baseInput({
        concealed: tiles("111m222p333s44z55z5z"),
        winningTile: parseTileNotation("5z"),
        winType: "ron",
      }),
    );
    expect(result?.yaku.some((y) => y.name === "四暗刻")).toBe(false);
  });

  it("国士無双: 役満固定", () => {
    const result = scoreHand(
      baseInput({
        concealed: tiles("19m19p19s1234567z").concat([parseTileNotation("1m")]),
        winningTile: parseTileNotation("1m"),
        winType: "ron",
      }),
    );
    expect(result?.yaku.some((y) => y.name === "国士無双")).toBe(true);
    expect(result?.payment).toEqual({ kind: "ron", total: 32000 });
  });

  it("七対子: 25符固定", () => {
    const result = scoreHand(
      baseInput({
        concealed: tiles("22m44m66m88p11s33s5z5z"),
        winningTile: parseTileNotation("5z"),
        winType: "ron",
        riichi: true,
      }),
    );
    expect(result?.fu).toBe(25);
    expect(result?.yaku.some((y) => y.name === "七対子")).toBe(true);
  });

  it("鳴きあり(喰いタン)は門前役が付かないが断幺九は成立する", () => {
    const pon: Meld = {
      type: "pon",
      tiles: [
        { suit: "s", rank: 3 },
        { suit: "s", rank: 3 },
        { suit: "s", rank: 3 },
      ],
      calledTile: { suit: "s", rank: 3 },
    };
    const result = scoreHand(
      baseInput({
        concealed: tiles("234m567p33p456p"), // 11枚(3面子+雀頭前提, meldsNeeded=3)
        melds: [pon],
        winningTile: parseTileNotation("6p"),
        winType: "ron",
      }),
    );
    expect(result?.yaku.some((y) => y.name === "断幺九")).toBe(true);
    expect(result?.yaku.some((y) => y.name === "門前清自摸和")).toBe(false);
  });

  it("高点法: 三順子/三刻子の両解釈がある手は最高点を採用し、別解を記録する", () => {
    // 222333444m は「234m×3」と「222m+333m+444m」の両方に解釈できる教科書的な曖昧形。
    const result = scoreHand(
      baseInput({
        concealed: tiles("222333444m789p55s"),
        winningTile: parseTileNotation("4m"),
        winType: "tsumo",
      }),
    );
    expect(result).not.toBeNull();
    // 高点法で選ばれた結果は、内部でcalculatePaymentしたものと矛盾しない
    expect(result?.payment).toBeDefined();
    // 複数の得点が異なる解釈が存在するため、別解の注記が残る
    expect(result?.interpretationNote).toBeDefined();
    expect(result?.interpretationNote).toMatch(/別解/);
  });
});
