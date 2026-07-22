import type { Tile } from "@/core/scoring/domain/tile";

/**
 * src/assets/tiles/*.svg を Vite の import.meta.glob で一括取り込みし、
 * ファイル名（拡張子なし）→ URL の辞書を作る。
 * 各SVGは同一IDを使い回しているため、必ず別々の <img>（外部リソース）として使い、
 * インライン展開・DOMマージはしない（url(#...) 衝突を避けるため）。
 */
const modules = import.meta.glob<string>("../../assets/tiles/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});

const urlByName: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  const name = path
    .split("/")
    .pop()!
    .replace(/\.svg$/, "");
  urlByName[name] = url;
}

function assetUrl(name: string): string {
  const url = urlByName[name];
  if (!url) throw new Error(`tile asset not found: ${name}.svg`);
  return url;
}

/** 牌の地（クリーム色の角丸）。絵柄の下に敷く。 */
export const frontUrl = assetUrl("Front");
/** 伏せ牌（単体で完結する背面）。 */
export const backUrl = assetUrl("Back");

const HONOR_ASSET_NAMES: Record<number, string> = {
  1: "Ton", // 東
  2: "Nan", // 南
  3: "Shaa", // 西
  4: "Pei", // 北
  5: "Haku", // 白
  6: "Hatsu", // 發
  7: "Chun", // 中
};

const SUIT_ASSET_PREFIX: Record<"m" | "p" | "s", string> = {
  m: "Man",
  p: "Pin",
  s: "Sou",
};

/** 牌 → 絵柄SVGのアセット名（拡張子なし）。 */
export function tileImageName(tile: Tile): string {
  if (tile.suit === "z") {
    return HONOR_ASSET_NAMES[tile.rank];
  }
  const prefix = SUIT_ASSET_PREFIX[tile.suit];
  if (tile.rank === 5 && tile.red) {
    return `${prefix}5-Dora`;
  }
  return `${prefix}${tile.rank}`;
}

/** 牌の絵柄SVGのURL（Frontの上に重ねる透明レイヤー）。 */
export function markUrl(tile: Tile): string {
  return assetUrl(tileImageName(tile));
}
