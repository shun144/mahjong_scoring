import type { Wind, WinType } from "./types";

export const WIND_LABELS: Record<Wind, string> = {
  east: "東",
  south: "南",
  west: "西",
  north: "北",
};

export const WIN_TYPE_LABELS: Record<WinType, string> = {
  tsumo: "ツモ",
  ron: "ロン",
};
