import { describe, expect, it } from "vitest";
import type { Meld } from "./meld";
import type { Tile } from "./tile";
import { scoreHand, type ScoreHandInput } from "./scoreHandService";
import { parseTileNotation } from "./tile";

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

function yakuNames(result: ReturnType<typeof scoreHand>): string[] {
  return result?.yaku.map((y) => y.name) ?? [];
}

describe("yaku catalogue via scoreHand", () => {
  it("三色同順: 門前2翻・鳴きで1翻に喰い下がる", () => {
    const menzen = scoreHand(
      baseInput({
        concealed: tiles("123m123p123s44z678s"),
        winningTile: parseTileNotation("8s"),
      }),
    );
    expect(yakuNames(menzen)).toContain("三色同順");
    expect(menzen?.yaku.find((y) => y.name === "三色同順")?.han).toBe(2);

    const chiMeld: Meld = {
      type: "chi",
      tiles: [
        { suit: "s", rank: 1 },
        { suit: "s", rank: 2 },
        { suit: "s", rank: 3 },
      ],
    };
    const open = scoreHand(
      baseInput({
        concealed: tiles("123m123p44z678s"),
        melds: [chiMeld],
        winningTile: parseTileNotation("8s"),
      }),
    );
    expect(open?.yaku.find((y) => y.name === "三色同順")?.han).toBe(1);
  });

  it("一気通貫: 123456789の同色三順子", () => {
    const result = scoreHand(
      baseInput({
        concealed: tiles("123456789m44z678p"),
        winningTile: parseTileNotation("8p"),
      }),
    );
    expect(yakuNames(result)).toContain("一気通貫");
  });

  it("混全帯幺九(チャンタ)と純全帯幺九(ジュンチャン)を区別する", () => {
    // チャンタ: 123m 789p 11z(雀頭,字牌) 123s 789m
    const chanta = scoreHand(
      baseInput({
        concealed: tiles("123m789p11z123s789m"),
        winningTile: parseTileNotation("9m"),
      }),
    );
    expect(yakuNames(chanta)).toContain("混全帯幺九");
    expect(yakuNames(chanta)).not.toContain("純全帯幺九");

    // ジュンチャン: 123m 789p 99s(雀頭,老頭牌) 123s 789m (字牌なし)
    const junchan = scoreHand(
      baseInput({
        concealed: tiles("123m789p99s123s789m"),
        winningTile: parseTileNotation("9m"),
      }),
    );
    expect(yakuNames(junchan)).toContain("純全帯幺九");
    expect(yakuNames(junchan)).not.toContain("混全帯幺九");
  });

  it("対々和: 4つの刻子", () => {
    const result = scoreHand(
      baseInput({
        concealed: tiles("111m222p333s44z55z5z"),
        winningTile: parseTileNotation("5z"),
      }),
    );
    expect(yakuNames(result)).toContain("対々和");
  });

  it("三色同刻: 同じ数字の刻子が3色", () => {
    // ロンでシャンポン完成させ、四暗刻(全暗刻)にならないようにする
    const result = scoreHand(
      baseInput({
        concealed: tiles("555m555p555s44z666z"),
        winningTile: parseTileNotation("6z"),
        winType: "ron",
      }),
    );
    expect(yakuNames(result)).toContain("三色同刻");
  });

  it("混老頭: 老頭牌と字牌のみの対々和", () => {
    // ロンでシャンポン完成させ、四暗刻(全暗刻)にならないようにする
    const result = scoreHand(
      baseInput({
        concealed: tiles("111m999p111s55z333z"),
        winningTile: parseTileNotation("3z"),
        winType: "ron",
      }),
    );
    expect(yakuNames(result)).toContain("混老頭");
  });

  it("小三元: 三元牌2つの刻子+1つの雀頭", () => {
    const result = scoreHand(
      baseInput({
        concealed: tiles("123m123p555z666z77z"),
        winningTile: parseTileNotation("7z"),
        winType: "tsumo",
      }),
    );
    expect(yakuNames(result)).toContain("小三元");
  });

  it("一盃口と二盃口を区別する", () => {
    const iipeikou = scoreHand(
      baseInput({
        concealed: tiles("112233m789p44z567s"),
        winningTile: parseTileNotation("7s"),
      }),
    );
    expect(yakuNames(iipeikou)).toContain("一盃口");
    expect(yakuNames(iipeikou)).not.toContain("二盃口");

    const ryanpeikou = scoreHand(
      baseInput({
        concealed: tiles("112233m44z556677p"),
        winningTile: parseTileNotation("7p"),
      }),
    );
    expect(yakuNames(ryanpeikou)).toContain("二盃口");
    expect(yakuNames(ryanpeikou)).not.toContain("一盃口");
  });

  it("混一色と清一色を区別する（鳴きで喰い下がり）", () => {
    const honitsu = scoreHand(
      baseInput({
        concealed: tiles("123m456m22z789m444z"),
        winningTile: parseTileNotation("4z"),
        winType: "tsumo",
      }),
    );
    expect(yakuNames(honitsu)).toContain("混一色");

    const chinitsu = scoreHand(
      baseInput({
        concealed: tiles("123456789m11m44m").concat([parseTileNotation("4m")]),
        winningTile: parseTileNotation("4m"),
        winType: "tsumo",
      }),
    );
    expect(yakuNames(chinitsu)).toContain("清一色");

    const ponMeld: Meld = {
      type: "pon",
      tiles: [
        { suit: "m", rank: 4 },
        { suit: "m", rank: 4 },
        { suit: "m", rank: 4 },
      ],
    };
    const openHonitsu = scoreHand(
      baseInput({
        concealed: tiles("123m789m111z22z"),
        melds: [ponMeld],
        winningTile: parseTileNotation("2z"),
        winType: "tsumo",
      }),
    );
    expect(openHonitsu?.yaku.find((y) => y.name === "混一色")?.han).toBe(2);
  });

  it("大三元: 役満、他の役と複合しない", () => {
    const result = scoreHand(
      baseInput({
        concealed: tiles("555z666z777z123m44m"),
        winningTile: parseTileNotation("4m"),
        winType: "tsumo",
        isDealer: true,
      }),
    );
    expect(yakuNames(result)).toEqual(["大三元"]);
    expect(result?.payment).toEqual({ kind: "tsumo-oya", each: 16000 });
  });

  it("字一色: 役満", () => {
    const result = scoreHand(
      baseInput({
        concealed: tiles("111z222z333z55z666z"),
        winningTile: parseTileNotation("6z"),
        winType: "tsumo",
      }),
    );
    expect(yakuNames(result)).toContain("字一色");
  });

  it("緑一色: 役満", () => {
    const result = scoreHand(
      baseInput({
        concealed: tiles("222s333s444s66z888s"),
        winningTile: parseTileNotation("8s"),
        winType: "tsumo",
      }),
    );
    expect(yakuNames(result)).toContain("緑一色");
  });

  it("清老頭: 役満", () => {
    const result = scoreHand(
      baseInput({
        concealed: tiles("111m999m111p999p11s"),
        winningTile: parseTileNotation("1s"),
        winType: "tsumo",
      }),
    );
    expect(yakuNames(result)).toContain("清老頭");
  });

  it("小四喜と大四喜を区別する", () => {
    const shousuushi = scoreHand(
      baseInput({
        concealed: tiles("111z222z333z44z55z5z"),
        winningTile: parseTileNotation("5z"),
        winType: "tsumo",
      }),
    );
    expect(yakuNames(shousuushi)).toContain("小四喜");

    const daisuushi = scoreHand(
      baseInput({
        concealed: tiles("111z222z333z444z55m"),
        winningTile: parseTileNotation("5m"),
        winType: "tsumo",
      }),
    );
    expect(yakuNames(daisuushi)).toContain("大四喜");
  });

  it("九蓮宝燈: 役満（門前限定）", () => {
    const result = scoreHand(
      baseInput({
        concealed: tiles("1112345678999m").concat([parseTileNotation("5m")]),
        winningTile: parseTileNotation("5m"),
        winType: "tsumo",
      }),
    );
    expect(yakuNames(result)).toContain("九蓮宝燈");
  });
});
