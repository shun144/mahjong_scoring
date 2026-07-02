import type { Tile } from "../../engine/model";
import { tileToLabel } from "../../engine/tiles";
import "./tiles.css";

export type TileSize = "sm" | "md" | "lg";

export interface TileFaceProps {
  tile: Tile;
  /** 副露で横向きに晒された牌として描画する。 */
  rotated?: boolean;
  /** 暗槓の両端など、伏せ牌として描画する。 */
  faceDown?: boolean;
  size?: TileSize;
  className?: string;
}

const SUITED_COLOR: Record<"m" | "p" | "s", string> = {
  m: "#1f2937",
  p: "#1d4ed8",
  s: "#15803d",
};

const RED_COLOR = "#dc2626";
const HONOR_COLOR: Record<number, string> = {
  1: "#1f2937", // 東
  2: "#1f2937", // 南
  3: "#1f2937", // 西
  4: "#1f2937", // 北
  5: "#1d4ed8", // 白（枠のみ）
  6: "#15803d", // 發
  7: "#dc2626", // 中
};

const SUIT_KANJI: Record<"m" | "p" | "s", string> = {
  m: "萬",
  p: "筒",
  s: "索",
};

const RANK_KANJI = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

function TileFaceBack({ size, className }: { size: TileSize; className?: string }) {
  return (
    <span
      className={`mj-tile-wrap mj-tile-size-${size} ${className ?? ""}`}
      role="img"
      aria-label="伏せ牌"
    >
      <svg className="mj-tile-svg" viewBox="0 0 40 56" aria-hidden="true">
        <rect x="1" y="1" width="38" height="54" rx="4" fill="#374151" stroke="#1f2937" />
        <rect x="6" y="6" width="28" height="44" rx="2" fill="none" stroke="#4b5563" strokeWidth="1.5" />
      </svg>
    </span>
  );
}

/** 1枚の牌をSVGで描画する表示コンポーネント。 */
export function TileFace({ tile, rotated, faceDown, size = "md", className }: TileFaceProps) {
  if (faceDown) {
    return <TileFaceBack size={size} className={className} />;
  }

  const label = tileToLabel(tile);
  const isHonor = tile.suit === "z";
  const color =
    tile.suit === "z"
      ? HONOR_COLOR[tile.rank]
      : tile.red
        ? RED_COLOR
        : SUITED_COLOR[tile.suit];

  const wrapClass = [
    "mj-tile-wrap",
    `mj-tile-size-${size}`,
    rotated ? "mj-tile-rotated" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={wrapClass} role="img" aria-label={label}>
      <svg className="mj-tile-svg" viewBox="0 0 40 56" aria-hidden="true">
        <rect x="1" y="1" width="38" height="54" rx="4" fill="#fffdf7" stroke="#d6d3cb" />
        {isHonor ? (
          tile.rank === 5 ? (
            // 白（ブランク牌。枠のみで表現）
            <>
              <rect x="9" y="14" width="22" height="28" rx="2" fill="none" stroke={color} strokeWidth="2.5" />
              <text x="20" y="50" textAnchor="middle" fontSize="7" fill="#9ca3af">
                白
              </text>
            </>
          ) : (
            <text
              x="20"
              y="34"
              textAnchor="middle"
              fontSize="22"
              fontWeight="700"
              fill={color}
              fontFamily="system-ui, 'Hiragino Sans', Meiryo, sans-serif"
            >
              {tileToLabel(tile)}
            </text>
          )
        ) : (
          <>
            <text
              x="20"
              y="28"
              textAnchor="middle"
              fontSize="22"
              fontWeight="700"
              fill={color}
              fontFamily="system-ui, 'Hiragino Sans', Meiryo, sans-serif"
            >
              {RANK_KANJI[tile.rank]}
            </text>
            <text
              x="20"
              y="47"
              textAnchor="middle"
              fontSize="14"
              fill={color}
              fontFamily="system-ui, 'Hiragino Sans', Meiryo, sans-serif"
            >
              {SUIT_KANJI[tile.suit as "m" | "p" | "s"]}
            </text>
            {tile.red ? <circle cx="32" cy="10" r="3" fill={RED_COLOR} /> : null}
          </>
        )}
      </svg>
    </span>
  );
}
