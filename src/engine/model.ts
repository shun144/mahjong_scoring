/**
 * 麻雀の牌・面子・局条件に関する基本ドメインモデル。
 * SPEC.md §6 のデータモデルに準拠する。
 */

/** 萬子/筒子/索子/字牌 */
export type Suit = "m" | "p" | "s" | "z";

/**
 * 牌。z(字牌)の rank は 1=東 2=南 3=西 4=北 5=白 6=發 7=中。
 * red は赤ドラ（m/p/s の rank=5 のみ有効）。
 */
export interface Tile {
  suit: Suit;
  rank: number;
  red?: boolean;
}

export type MeldType = "chi" | "pon" | "minkan" | "ankan";

/**
 * 副露（鳴き）。type がチー/ポン/明槓なら鳴いた面子（表示上は1枚を横向きにする）、
 * ankan（暗槓）は両端を伏せ牌で表示する。鳴いた牌の位置は本アプリの採点・学習に
 * 影響しないため、どの牌を横向きにするかは表示側で type から決める（データには持たない）。
 */
export interface Meld {
  type: MeldType;
  tiles: Tile[];
}

export type Wind = "east" | "south" | "west" | "north";
export type WinType = "tsumo" | "ron";

/** 字牌 rank(1-7) と名称の対応。 */
export const HONOR_NAMES: Record<number, { kanji: string; label: string }> = {
  1: { kanji: "東", label: "東" },
  2: { kanji: "南", label: "南" },
  3: { kanji: "西", label: "西" },
  4: { kanji: "北", label: "北" },
  5: { kanji: "白", label: "白" },
  6: { kanji: "發", label: "發" },
  7: { kanji: "中", label: "中" },
};

export const WIND_TO_HONOR_RANK: Record<Wind, number> = {
  east: 1,
  south: 2,
  west: 3,
  north: 4,
};

export const SUIT_LABELS: Record<Suit, string> = {
  m: "萬",
  p: "筒",
  s: "索",
  z: "字",
};
