/**
 * 上がった際の局条件に関する型情報
 */
/** 自風・場風 */
export type Wind = "east" | "south" | "west" | "north";

/** アガリの形 */
export type WinType = "tsumo" | "ron";

export interface YakuResult {
  name: string;
  han: number;
}

export type Payment =
  | { kind: "ron"; total: number }
  | { kind: "tsumo-ko"; nonDealer: number; dealer: number }
  | { kind: "tsumo-oya"; each: number };
