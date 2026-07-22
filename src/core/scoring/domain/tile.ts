import type { Wind } from "./matchContext";

/**
 * 牌に関する値オブジェクトと、その振る舞い（検証・比較・分類・整形）。
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

/** 字牌 rank(1-7) と名称の対応。 */
export const HONOR_NAMES: Record<number, { label: string }> = {
  1: { label: "東" },
  2: { label: "南" },
  3: { label: "西" },
  4: { label: "北" },
  5: { label: "白" },
  6: { label: "發" },
  7: { label: "中" },
};

/** 種類(suit)ごとの表示名。 */
export const SUIT_LABELS: Record<Suit, string> = {
  m: "萬",
  p: "筒",
  s: "索",
  z: "字",
};

/** 牌種インデックスの基準となる suit の並び順（m→p→s→z）。 */
const SUIT_BY_INDEX: Suit[] = ["m", "p", "s", "z"];
/** suit から並び順インデックスを引くための逆引きテーブル。 */
const SUIT_INDEX: Record<Suit, number> = { m: 0, p: 1, s: 2, z: 3 };

/** 風牌(東西南北) */
const WIND_TYPES: readonly number[] = [27, 28, 29, 30];

/** 三元牌(白發中) */
const SANGEN_TYPES: readonly number[] = [31, 32, 33];

/**
 * 牌を赤ドラを無視した34種の牌種インデックス(0-33)に変換する。
 * 0-8: 1m-9m / 9-17: 1p-9p / 18-26: 1s-9s / 27-33: 1z-7z
 */
export function tileToType(tile: Tile): number {
  const base = { m: 0, p: 9, s: 18, z: 27 }[tile.suit];
  return base + (tile.rank - 1);
}

/** 34種の牌種インデックス(0-33)を牌に変換する */
export function typeToTile(type: number): Tile {
  const suit = SUIT_BY_INDEX[Math.floor(type / 9)];
  const rank = (type % 9) + 1;
  return { suit, rank };
}

/** 牌種インデックスが字牌かどうかを判定する。 */
export function isHonorType(type: number): boolean {
  return type >= 27;
}

/** 牌種インデックスが老頭牌（1・9の数牌）かどうかを判定する。 */
export function isTerminal(type: number): boolean {
  if (isHonorType(type)) return false;
  const rank = (type % 9) + 1;
  return rank === 1 || rank === 9;
}

/** 牌種インデックスが么九牌（老頭牌または字牌）かどうかを判定する。 */
export function isTerminalOrHonor(type: number): boolean {
  if (isHonorType(type)) return true; // 字牌
  const rank = (type % 9) + 1;
  return rank === 1 || rank === 9;
}

/** 牌種インデックスが三元牌(白發中)かどうかを判定する。 */
export function isSangenType(type: number): boolean {
  return SANGEN_TYPES.includes(type);
}

/** 牌種インデックスが風牌(東西南北)かどうかを判定する。 */
export function isWindType(type: number): boolean {
  return WIND_TYPES.includes(type);
}

/** 風牌（東南西北）の牌種インデックスに変換する（東=27/南=28/西=29/北=30）。 */
export function windToHonorType(wind: Wind): number {
  const rank = { east: 1, south: 2, west: 3, north: 4 }[wind];
  return 27 + (rank - 1);
}

/** 牌種インデックスが緑一色の対象牌（2,3,4,6,8索 + 發）かどうかを判定する。 */
export function isGreenType(type: number): boolean {
  // 緑一色: 2,3,4,6,8索 + 發
  const greenSou = [2, 3, 4, 6, 8].map((r) => 18 + (r - 1));
  return greenSou.includes(type) || type === 27 + 5; // 發 = z6 -> index 27+5
}

/** 牌配列を34種カウント配列に集計する。 */
export function tilesToCounts(tiles: readonly Tile[]): number[] {
  const counts = new Array(34).fill(0);

  for (const t of tiles) {
    counts[tileToType(t)] += 1;
  }
  return counts;
}

/** カウント配列の合計枚数を返す。 */
export function totalCount(counts: readonly number[]): number {
  return counts.reduce((a, b) => a + b, 0);
}

/** 牌として有効な suit/rank/red の組み合わせか検証する。 */
export function isValidTile(tile: Tile): boolean {
  if (tile.suit === "z") {
    return Number.isInteger(tile.rank) && tile.rank >= 1 && tile.rank <= 7 && !tile.red;
  }
  if (!Number.isInteger(tile.rank) || tile.rank < 1 || tile.rank > 9) {
    return false;
  }
  if (tile.red && tile.rank !== 5) return false;
  return true;
}

/** 牌が不正な場合にErrorを投げる（isValidTileのアサーション版）。 */
function assertValidTile(tile: Tile): void {
  if (!isValidTile(tile)) {
    throw new Error(`invalid tile: ${JSON.stringify(tile)}`);
  }
}

/** 牌の同一性を比較する（赤ドラの有無も区別する）。 */
export function tilesEqual(a: Tile, b: Tile): boolean {
  return a.suit === b.suit && a.rank === b.rank && !!a.red === !!b.red;
}

/**
 * ソート・比較用のキー。suit(m<p<s<z) → rank の順。
 * 赤5と通常5は同じ並び順（赤かどうかはソートに影響しない）。
 */
export function tileSortKey(tile: Tile): number {
  return SUIT_INDEX[tile.suit] * 10 + tile.rank;
}

/** 牌のソート用比較関数（Array.prototype.sortにそのまま渡せる）。 */
export function compareTiles(a: Tile, b: Tile): number {
  return tileSortKey(a) - tileSortKey(b);
}

/** 牌配列を破壊せずソートしたコピーを返す。 */
export function sortTiles(tiles: readonly Tile[]): Tile[] {
  return [...tiles].sort(compareTiles);
}

/**
 * 配列から target と一致する牌を1枚だけ取り除いたコピーを返す（他の一致牌は残す）。
 * 一致する牌が無い場合は元の内容のコピーを返す。
 */
export function removeOneMatchingTile(tiles: readonly Tile[], target: Tile): Tile[] {
  const index = tiles.findIndex((t) => tilesEqual(t, target));
  if (index === -1) return [...tiles];
  return [...tiles.slice(0, index), ...tiles.slice(index + 1)];
}

/**
 * 牌を記法文字列に変換する（例: "5m", "1z"）。
 * 赤ドラは慣例に従い rank を "0" として表す（例: "0m" = 赤五萬）。
 */
export function tileToNotation(tile: Tile): string {
  assertValidTile(tile);
  const rankPart = tile.red ? "0" : String(tile.rank);
  return `${rankPart}${tile.suit}`;
}

/** 牌の表示用ラベル（例: "五萬(赤)", "東"）。 */
export function tileToLabel(tile: Tile): string {
  assertValidTile(tile);
  if (tile.suit === "z") {
    return HONOR_NAMES[tile.rank].label;
  }
  const suitKanji = { m: "萬", p: "筒", s: "索" }[tile.suit];
  const digits = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  const base = `${digits[tile.rank]}${suitKanji}`;
  return tile.red ? `${base}(赤)` : base;
}

/** 記法文字列（例: "5m", "0p"）のパターン。数字1桁＋suit1文字。 */
const NOTATION_PATTERN = /^([0-9])([mpsz])$/;

/**
 * 記法文字列を牌に変換する（例: "5m" → 五萬, "0p" → 赤五筒）。
 * 不正な記法は Error を投げる。
 */
export function parseTileNotation(notation: string): Tile {
  const match = NOTATION_PATTERN.exec(notation.trim());
  if (!match) {
    throw new Error(`invalid tile notation: "${notation}"`);
  }
  const [, rankStr, suit] = match;
  const rankNum = Number(rankStr);
  const tile: Tile =
    rankNum === 0
      ? { suit: suit as Suit, rank: 5, red: true }
      : { suit: suit as Suit, rank: rankNum };
  assertValidTile(tile);
  return tile;
}

/** 複数牌をまとめて記法文字列にする（例: "123m 5p 1z"）。牌ごとに空白区切り。 */
export function tilesToNotation(tiles: readonly Tile[]): string {
  return tiles.map(tileToNotation).join(" ");
}
