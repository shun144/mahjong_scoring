/**
 * 局条件（自風・場風・上がり方）に関する値オブジェクト。
 * SPEC.md §6 のデータモデルに準拠する。
 */

export type Wind = "east" | "south" | "west" | "north";
export type WinType = "tsumo" | "ron";

export const WIND_TO_HONOR_RANK: Record<Wind, number> = {
  east: 1,
  south: 2,
  west: 3,
  north: 4,
};
