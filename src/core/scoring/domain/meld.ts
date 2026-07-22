import type { Tile } from "./tile";

/**
 * 副露（鳴き）・面子に関する値オブジェクト。
 * SPEC.md §6 のデータモデルに準拠する。
 */

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
