import { describe, expect, it } from "vitest";
import { calculatePayment, determineRank } from "./scoreService";

describe("calculatePayment - representative non-mangan combinations (SPEC.md §5.3)", () => {
  it("子ロン 30符1翻 = 1000", () => {
    expect(calculatePayment(1, 30, false, "ron").payment).toEqual({ kind: "ron", total: 1000 });
  });
  it("子ロン 30符2翻 = 2000", () => {
    expect(calculatePayment(2, 30, false, "ron").payment).toEqual({ kind: "ron", total: 2000 });
  });
  it("子ロン 30符3翻 = 3900", () => {
    expect(calculatePayment(3, 30, false, "ron").payment).toEqual({ kind: "ron", total: 3900 });
  });
  it("子ロン 40符2翻 = 2600", () => {
    expect(calculatePayment(2, 40, false, "ron").payment).toEqual({ kind: "ron", total: 2600 });
  });
  it("子ロン 40符3翻 = 5200", () => {
    expect(calculatePayment(3, 40, false, "ron").payment).toEqual({ kind: "ron", total: 5200 });
  });
  it("子ロン 25符2翻 = 1600", () => {
    expect(calculatePayment(2, 25, false, "ron").payment).toEqual({ kind: "ron", total: 1600 });
  });
  it("親ロン 30符1翻 = 1500", () => {
    expect(calculatePayment(1, 30, true, "ron").payment).toEqual({ kind: "ron", total: 1500 });
  });
  it("親ロン 30符2翻 = 2900", () => {
    expect(calculatePayment(2, 30, true, "ron").payment).toEqual({ kind: "ron", total: 2900 });
  });
  it("親ロン 40符3翻 = 7700", () => {
    expect(calculatePayment(3, 40, true, "ron").payment).toEqual({ kind: "ron", total: 7700 });
  });
});

describe("calculatePayment - tsumo payments", () => {
  it("子ツモ 30符2翻 = 500/1000", () => {
    const { payment } = calculatePayment(2, 30, false, "tsumo");
    expect(payment).toEqual({ kind: "tsumo-ko", nonDealer: 500, dealer: 1000 });
  });
  it("親ツモ 30符2翻 = 1000オール", () => {
    const { payment } = calculatePayment(2, 30, true, "tsumo");
    expect(payment).toEqual({ kind: "tsumo-oya", each: 1000 });
  });
});

describe("calculatePayment - mangan and above (fixed tables)", () => {
  it("4翻30符は満貫未満(7700)", () => {
    const { rank, payment } = calculatePayment(4, 30, false, "ron");
    expect(rank).toBeNull();
    expect(payment).toEqual({ kind: "ron", total: 7700 });
  });
  it("4翻40符は満貫(basicPoints>=2000)", () => {
    const { rank, payment } = calculatePayment(4, 40, false, "ron");
    expect(rank).toBe("mangan");
    expect(payment).toEqual({ kind: "ron", total: 8000 });
  });
  it("5翻は符に関わらず満貫", () => {
    const { rank, payment } = calculatePayment(5, 20, true, "ron");
    expect(rank).toBe("mangan");
    expect(payment).toEqual({ kind: "ron", total: 12000 });
  });
  it("満貫 子ツモ = 2000/4000", () => {
    const { payment } = calculatePayment(5, 30, false, "tsumo");
    expect(payment).toEqual({ kind: "tsumo-ko", nonDealer: 2000, dealer: 4000 });
  });
  it("跳満(6-7翻) 子ロン = 12000", () => {
    expect(calculatePayment(6, 30, false, "ron").payment).toEqual({ kind: "ron", total: 12000 });
    expect(calculatePayment(7, 30, false, "ron").payment).toEqual({ kind: "ron", total: 12000 });
  });
  it("倍満(8-10翻) 親ロン = 24000", () => {
    expect(calculatePayment(8, 30, true, "ron").payment).toEqual({ kind: "ron", total: 24000 });
    expect(calculatePayment(10, 30, true, "ron").payment).toEqual({ kind: "ron", total: 24000 });
  });
  it("三倍満(11-12翻) 子ロン = 24000", () => {
    expect(calculatePayment(11, 30, false, "ron").payment).toEqual({ kind: "ron", total: 24000 });
  });
  it("役満(13翻以上、数え役満含む) 子ロン = 32000 / 親ロン = 48000", () => {
    expect(calculatePayment(13, 30, false, "ron").payment).toEqual({ kind: "ron", total: 32000 });
    expect(calculatePayment(13, 30, true, "ron").payment).toEqual({ kind: "ron", total: 48000 });
  });
  it("役満 親ツモ = 16000オール", () => {
    const { payment } = calculatePayment(13, 30, true, "tsumo");
    expect(payment).toEqual({ kind: "tsumo-oya", each: 16000 });
  });
});

// 切り上げ満貫ルール（オプション）。既定の計算経路では未使用のため、
// roundUpMangan を明示的に渡した場合のみ 4翻30符・3翻60符 を満貫へ切り上げる。
describe("calculatePayment - 切り上げ満貫 (roundUpMangan option)", () => {
  it("既定(オプション無し)では 4翻30符 は満貫未満のまま = 7700", () => {
    const { rank, payment } = calculatePayment(4, 30, false, "ron");
    expect(rank).toBeNull();
    expect(payment).toEqual({ kind: "ron", total: 7700 });
  });

  it("子ロン 4翻30符 = 7700→8000(満貫)", () => {
    const { rank, payment } = calculatePayment(4, 30, false, "ron", { roundUpMangan: true });
    expect(rank).toBe("mangan");
    expect(payment).toEqual({ kind: "ron", total: 8000 });
  });

  it("子ロン 3翻60符 = 7700→8000(満貫)", () => {
    const { rank, payment } = calculatePayment(3, 60, false, "ron", { roundUpMangan: true });
    expect(rank).toBe("mangan");
    expect(payment).toEqual({ kind: "ron", total: 8000 });
  });

  it("親ロン 4翻30符 = 11600→12000(満貫)", () => {
    const { rank, payment } = calculatePayment(4, 30, true, "ron", { roundUpMangan: true });
    expect(rank).toBe("mangan");
    expect(payment).toEqual({ kind: "ron", total: 12000 });
  });

  it("子ツモ 4翻30符 = 2000-3900→2000-4000(満貫)", () => {
    const { rank, payment } = calculatePayment(4, 30, false, "tsumo", { roundUpMangan: true });
    expect(rank).toBe("mangan");
    expect(payment).toEqual({ kind: "tsumo-ko", nonDealer: 2000, dealer: 4000 });
  });

  it("親ツモ 4翻30符 = 3900オール→4000オール(満貫)", () => {
    const { rank, payment } = calculatePayment(4, 30, true, "tsumo", { roundUpMangan: true });
    expect(rank).toBe("mangan");
    expect(payment).toEqual({ kind: "tsumo-oya", each: 4000 });
  });

  it("基本点1920未満(3翻40符=1280)は切り上げ満貫でも満貫にしない", () => {
    expect(determineRank(3, 40, { roundUpMangan: true })).toBeNull();
    const { payment } = calculatePayment(3, 40, false, "ron", { roundUpMangan: true });
    expect(payment).toEqual({ kind: "ron", total: 5200 });
  });
});
