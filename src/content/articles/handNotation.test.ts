import { describe, expect, it } from "vitest";
import { parseHandNotation } from "./handNotation";

describe("parseHandNotation", () => {
  it("グループ記法を牌配列に展開する", () => {
    const result = parseHandNotation("234m 567p 345s 99m");
    expect(result).toEqual({
      hand: [
        { suit: "m", rank: 2 },
        { suit: "m", rank: 3 },
        { suit: "m", rank: 4 },
        { suit: "p", rank: 5 },
        { suit: "p", rank: 6 },
        { suit: "p", rank: 7 },
        { suit: "s", rank: 3 },
        { suit: "s", rank: 4 },
        { suit: "s", rank: 5 },
        { suit: "m", rank: 9 },
        { suit: "m", rank: 9 },
      ],
    });
  });

  it("'|' の右を上がり牌として解釈する", () => {
    const result = parseHandNotation("45678p 123s 234m 99m | 9p");
    expect(result?.winningTile).toEqual({ suit: "p", rank: 9 });
    expect(result?.hand).toHaveLength(13);
  });

  it("赤5(0)を解釈する", () => {
    const result = parseHandNotation("0m 234p");
    expect(result?.hand[0]).toEqual({ suit: "m", rank: 5, red: true });
  });

  it("字牌のグループ記法を解釈する", () => {
    const result = parseHandNotation("11z 567p");
    expect(result?.hand[0]).toEqual({ suit: "z", rank: 1 });
  });

  it("空文字列は null", () => {
    expect(parseHandNotation("")).toBeNull();
    expect(parseHandNotation("   ")).toBeNull();
  });

  it("不正なサフィックスは null", () => {
    expect(parseHandNotation("234x")).toBeNull();
  });

  it("範囲外の数字は null", () => {
    expect(parseHandNotation("0z")).toBeNull();
    expect(parseHandNotation("9z")).toBeNull();
  });

  it("上がり牌が複数枚・複数トークンなら null", () => {
    expect(parseHandNotation("234m | 99p")).toBeNull();
    expect(parseHandNotation("234m | 9p 9s")).toBeNull();
  });

  it("'|' が2つ以上あれば null", () => {
    expect(parseHandNotation("234m | 9p | 9s")).toBeNull();
  });

  it("キー行形式で牌姿・上がり牌・門前/鳴きの翻数を解釈する", () => {
    const result = parseHandNotation("hand: 45678p 123s 234m 99m | 9p\nmenzen: 1\nnaki: -");
    expect(result?.hand).toHaveLength(13);
    expect(result?.winningTile).toEqual({ suit: "p", rank: 9 });
    expect(result?.menzen).toBe("1");
    expect(result?.naki).toBe("-");
  });

  it("キー行の順序が違っても解釈できる", () => {
    const result = parseHandNotation("menzen: 2\nnaki: 1\nhand: 234m 567p 345s 99m");
    expect(result?.menzen).toBe("2");
    expect(result?.naki).toBe("1");
    expect(result?.hand).toHaveLength(11);
  });

  it("キー行形式で hand が無ければ null", () => {
    expect(parseHandNotation("menzen: 1\nnaki: -")).toBeNull();
  });

  it("キー行形式で hand の牌が不正なら null", () => {
    expect(parseHandNotation("hand: not a hand\nmenzen: 1")).toBeNull();
  });

  it("未知のキーがあれば null", () => {
    expect(parseHandNotation("hand: 234m\nfoo: bar")).toBeNull();
  });
});
