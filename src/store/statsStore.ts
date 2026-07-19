import type { Problem } from "../data/problem";

const STORAGE_KEY = "mahjong-scoring:stats:v1";
const MAX_HISTORY = 500;

export interface AnswerRecord {
  timestamp: number;
  isCorrect: boolean;
  fuType: number;
  yakuCategories: string[];
}

export interface TagStat {
  correct: number;
  total: number;
}

export interface StatsState {
  totalAnswered: number;
  totalCorrect: number;
  currentStreak: number;
  bestStreak: number;
  history: AnswerRecord[];
  /** キーは符の値を文字列化したもの（例: "30"）。 */
  byFuType: Record<string, TagStat>;
  /** キーは役名（例: "リーチ"）。 */
  byYakuCategory: Record<string, TagStat>;
  /** 「今日の回答数」（モメンタムカウンタ）。todayDate の日に回答した数。 */
  todayAnswered: number;
  /** todayAnswered が対象とする日付（ローカル日付、"YYYY-MM-DD"）。 */
  todayDate: string;
}

/** ローカル日付を "YYYY-MM-DD" で表す（today の回答数を日跨ぎでリセットするためのキー）。 */
export function todayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function createEmptyStats(): StatsState {
  return {
    totalAnswered: 0,
    totalCorrect: 0,
    currentStreak: 0,
    bestStreak: 0,
    history: [],
    byFuType: {},
    byYakuCategory: {},
    todayAnswered: 0,
    todayDate: todayKey(),
  };
}

/** 今日の回答数を返す。保存データの日付が今日でなければ（未跨ぎ更新前）0として扱う。 */
export function getTodayAnswered(stats: StatsState): number {
  return stats.todayDate === todayKey() ? stats.todayAnswered : 0;
}

function isStatsState(value: unknown): value is StatsState {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.totalAnswered === "number" &&
    typeof v.totalCorrect === "number" &&
    typeof v.currentStreak === "number" &&
    typeof v.bestStreak === "number" &&
    Array.isArray(v.history) &&
    typeof v.byFuType === "object" &&
    v.byFuType !== null &&
    typeof v.byYakuCategory === "object" &&
    v.byYakuCategory !== null
  );
}

/**
 * 保存済みデータに todayAnswered/todayDate が無い場合（T-008 以前の旧データ）に
 * 補う。今日の回答数は旧データからは分からないため 0 から始める。
 */
function withToday(stats: StatsState): StatsState {
  if (typeof stats.todayAnswered === "number" && typeof stats.todayDate === "string") {
    return stats;
  }
  return { ...stats, todayAnswered: 0, todayDate: todayKey() };
}

/** localStorageから成績を読み込む。無い/壊れている場合は空の成績を返す。 */
export function loadStats(): StatsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyStats();
    const parsed: unknown = JSON.parse(raw);
    return isStatsState(parsed) ? withToday(parsed) : createEmptyStats();
  } catch {
    return createEmptyStats();
  }
}

export function saveStats(stats: StatsState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // プライベートモード等でlocalStorageが使えない場合は黙って諦める。
  }
}

/**
 * 保存済みの成績をすべて消去する（localStorageのキーを削除）。
 * 取り消せない操作のため、呼び出し側（UI）で確認を挟むこと。
 * 集計・苦手復習の重み付けは history から導出されるため、このキー削除で成績は完全に初期化される。
 * 空の成績を返し、呼び出し側の状態更新に使えるようにする。
 */
export function clearStats(): StatsState {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorageが使えない環境では何もしない。
  }
  return createEmptyStats();
}

function bumpTag(map: Record<string, TagStat>, key: string, isCorrect: boolean): void {
  const current = map[key] ?? { correct: 0, total: 0 };
  map[key] = {
    correct: current.correct + (isCorrect ? 1 : 0),
    total: current.total + 1,
  };
}

/**
 * 回答結果を記録し、更新後の成績をlocalStorageに保存して返す。
 * 符の型・役の種類の2軸で正誤を集計する（SPEC.md §4.5）。
 */
export function recordAnswer(problem: Problem, isCorrect: boolean): StatsState {
  const stats = loadStats();

  stats.totalAnswered += 1;
  if (isCorrect) {
    stats.totalCorrect += 1;
    stats.currentStreak += 1;
    stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
  } else {
    stats.currentStreak = 0;
  }

  // 今日の回答数（モメンタムカウンタ）: 正誤に関わらず加算し、絶対に減らさない（非懲罰）。
  const key = todayKey();
  if (stats.todayDate !== key) {
    stats.todayDate = key;
    stats.todayAnswered = 0;
  }
  stats.todayAnswered += 1;

  stats.history.push({
    timestamp: Date.now(),
    isCorrect,
    fuType: problem.tags.fuType,
    yakuCategories: problem.tags.yakuCategories,
  });
  if (stats.history.length > MAX_HISTORY) {
    stats.history = stats.history.slice(stats.history.length - MAX_HISTORY);
  }

  bumpTag(stats.byFuType, String(problem.tags.fuType), isCorrect);
  for (const category of problem.tags.yakuCategories) {
    bumpTag(stats.byYakuCategory, category, isCorrect);
  }

  saveStats(stats);
  return stats;
}
