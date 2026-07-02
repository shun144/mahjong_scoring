import { HONOR_NAMES, type Suit, type Tile } from "./model";

const SUIT_ORDER: Record<Suit, number> = { m: 0, p: 1, s: 2, z: 3 };

/** 牌として有効な suit/rank/red の組み合わせか検証する。 */
export function isValidTile(tile: Tile): boolean {
  if (tile.suit === "z") {
    return (
      Number.isInteger(tile.rank) &&
      tile.rank >= 1 &&
      tile.rank <= 7 &&
      !tile.red
    );
  }
  if (!Number.isInteger(tile.rank) || tile.rank < 1 || tile.rank > 9) {
    return false;
  }
  if (tile.red && tile.rank !== 5) return false;
  return true;
}

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
  return SUIT_ORDER[tile.suit] * 10 + tile.rank;
}

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
