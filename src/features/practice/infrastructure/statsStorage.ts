import type { StatsState } from "../application/statsStore";

const STORAGE_KEY = "mahjong-scoring:stats:v1";

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

/** localStorageから成績の生データを読み込む。無い/壊れている場合は null を返す。 */
export function readStats(): StatsState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isStatsState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeStats(stats: StatsState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // プライベートモード等でlocalStorageが使えない場合は黙って諦める。
  }
}

/** 保存済みの成績をlocalStorageから削除する。 */
export function removeStats(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorageが使えない環境では何もしない。
  }
}
