import { beforeEach, describe, expect, it } from "vitest";
import type { Problem } from "../data/problem";
import {
  clearStats,
  createEmptyStats,
  getTodayAnswered,
  loadStats,
  recordAnswer,
  saveStats,
  todayKey,
} from "./statsStore";

function fakeProblem(fuType: number, yakuCategories: string[]): Problem {
  return {
    id: "p1",
    source: "bank",
    hand: {
      concealed: [],
      melds: [],
      winningTile: { suit: "m", rank: 1 },
      winType: "ron",
    },
    doraIndicators: [],
    uraDoraIndicators: [],
    conditions: { seatWind: "east", roundWind: "east", isDealer: false, riichi: false },
    answer: {
      yaku: yakuCategories.map((name) => ({ name, han: 1 })),
      han: yakuCategories.length,
      fu: fuType,
      payment: { kind: "ron", total: 1000 },
    },
    tags: { fuType, yakuCategories },
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe("loadStats", () => {
  it("returns an empty stats object when nothing is stored", () => {
    expect(loadStats()).toEqual(createEmptyStats());
  });

  it("returns an empty stats object when the stored value is corrupt JSON", () => {
    localStorage.setItem("mahjong-scoring:stats:v1", "{not json");
    expect(loadStats()).toEqual(createEmptyStats());
  });

  it("returns an empty stats object when the stored value has the wrong shape", () => {
    localStorage.setItem("mahjong-scoring:stats:v1", JSON.stringify({ foo: "bar" }));
    expect(loadStats()).toEqual(createEmptyStats());
  });

  it("round-trips a saved stats object", () => {
    const stats = createEmptyStats();
    stats.totalAnswered = 5;
    saveStats(stats);
    expect(loadStats()).toEqual(stats);
  });
});

describe("clearStats", () => {
  it("removes saved stats so a subsequent load returns empty stats", () => {
    recordAnswer(fakeProblem(30, ["リーチ"]), true);
    recordAnswer(fakeProblem(40, ["平和"]), false);
    expect(loadStats().totalAnswered).toBe(2);

    clearStats();

    expect(loadStats()).toEqual(createEmptyStats());
    expect(localStorage.getItem("mahjong-scoring:stats:v1")).toBeNull();
  });

  it("returns an empty stats object", () => {
    recordAnswer(fakeProblem(30, ["リーチ"]), true);
    expect(clearStats()).toEqual(createEmptyStats());
  });
});

describe("recordAnswer", () => {
  it("increments totalAnswered and totalCorrect on a correct answer", () => {
    const stats = recordAnswer(fakeProblem(30, ["リーチ"]), true);
    expect(stats.totalAnswered).toBe(1);
    expect(stats.totalCorrect).toBe(1);
  });

  it("increments totalAnswered but not totalCorrect on an incorrect answer", () => {
    const stats = recordAnswer(fakeProblem(30, ["リーチ"]), false);
    expect(stats.totalAnswered).toBe(1);
    expect(stats.totalCorrect).toBe(0);
  });

  it("tracks current and best streaks, resetting current on a miss", () => {
    recordAnswer(fakeProblem(30, ["リーチ"]), true);
    recordAnswer(fakeProblem(30, ["リーチ"]), true);
    let stats = recordAnswer(fakeProblem(30, ["リーチ"]), true);
    expect(stats.currentStreak).toBe(3);
    expect(stats.bestStreak).toBe(3);

    stats = recordAnswer(fakeProblem(30, ["リーチ"]), false);
    expect(stats.currentStreak).toBe(0);
    expect(stats.bestStreak).toBe(3); // 最高記録は維持される

    stats = recordAnswer(fakeProblem(30, ["リーチ"]), true);
    expect(stats.currentStreak).toBe(1);
    expect(stats.bestStreak).toBe(3);
  });

  it("aggregates by fuType", () => {
    recordAnswer(fakeProblem(30, ["リーチ"]), true);
    recordAnswer(fakeProblem(30, ["平和"]), false);
    const stats = recordAnswer(fakeProblem(40, ["役牌(白)"]), true);
    expect(stats.byFuType["30"]).toEqual({ correct: 1, total: 2 });
    expect(stats.byFuType["40"]).toEqual({ correct: 1, total: 1 });
  });

  it("aggregates by every yaku category on the problem", () => {
    const stats = recordAnswer(fakeProblem(30, ["リーチ", "平和", "ドラ"]), true);
    expect(stats.byYakuCategory["リーチ"]).toEqual({ correct: 1, total: 1 });
    expect(stats.byYakuCategory["平和"]).toEqual({ correct: 1, total: 1 });
    expect(stats.byYakuCategory["ドラ"]).toEqual({ correct: 1, total: 1 });
  });

  it("persists across loads", () => {
    recordAnswer(fakeProblem(30, ["リーチ"]), true);
    const reloaded = loadStats();
    expect(reloaded.totalAnswered).toBe(1);
    expect(reloaded.byFuType["30"]).toEqual({ correct: 1, total: 1 });
  });

  it("records a history entry with the correct tags", () => {
    const stats = recordAnswer(fakeProblem(25, ["七対子"]), false);
    expect(stats.history).toHaveLength(1);
    expect(stats.history[0]).toMatchObject({
      isCorrect: false,
      fuType: 25,
      yakuCategories: ["七対子"],
    });
    expect(typeof stats.history[0].timestamp).toBe("number");
  });

  it("caps history length so it does not grow without bound", () => {
    for (let i = 0; i < 550; i++) {
      recordAnswer(fakeProblem(30, ["リーチ"]), true);
    }
    const stats = loadStats();
    expect(stats.history.length).toBeLessThanOrEqual(500);
    expect(stats.totalAnswered).toBe(550); // 集計自体は打ち切らない
  });

  it("increments todayAnswered on both correct and incorrect answers (throughput, non-punitive)", () => {
    let stats = recordAnswer(fakeProblem(30, ["リーチ"]), true);
    expect(stats.todayAnswered).toBe(1);
    stats = recordAnswer(fakeProblem(30, ["リーチ"]), false);
    expect(stats.todayAnswered).toBe(2); // 不正解でも今日の回答数は加算される（減らない）
  });

  it("resets todayAnswered (but not totalAnswered) when the stored date is not today", () => {
    const yesterday = createEmptyStats();
    yesterday.totalAnswered = 10;
    yesterday.todayDate = todayKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
    yesterday.todayAnswered = 5;
    saveStats(yesterday);

    const stats = recordAnswer(fakeProblem(30, ["リーチ"]), true);

    expect(stats.todayDate).toBe(todayKey());
    expect(stats.todayAnswered).toBe(1); // 日跨ぎでリセットされ、今日の1回のみ
    expect(stats.totalAnswered).toBe(11); // 累計は跨ぎの影響を受けない
  });
});

describe("getTodayAnswered", () => {
  it("returns 0 for stats with no history", () => {
    expect(getTodayAnswered(createEmptyStats())).toBe(0);
  });

  it("returns todayAnswered when the stored date is today", () => {
    const stats = recordAnswer(fakeProblem(30, ["リーチ"]), true);
    expect(getTodayAnswered(stats)).toBe(1);
  });

  it("returns 0 when the stored date is not today (stale, not yet rolled over)", () => {
    const stats = createEmptyStats();
    stats.todayDate = todayKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
    stats.todayAnswered = 7;
    expect(getTodayAnswered(stats)).toBe(0);
  });
});
