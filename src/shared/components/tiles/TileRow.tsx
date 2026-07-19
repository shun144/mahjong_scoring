import type { Tile } from "../../../engine/model";
import { TileFace, type TileSize } from "./TileFace";
import "./tiles.css";

export interface TileRowProps {
  tiles: readonly Tile[];
  size?: TileSize;
  /** 各牌に一意なkeyを振るための接頭辞。 */
  keyPrefix?: string;
  className?: string;
}

/** 牌の横並び表示（純手牌など）。 */
export function TileRow({ tiles, size = "md", keyPrefix = "t", className }: TileRowProps) {
  return (
    <span className={`mj-tile-row ${className ?? ""}`}>
      {tiles.map((tile, i) => (
        <TileFace key={`${keyPrefix}-${i}-${tile.suit}${tile.rank}${tile.red ? "r" : ""}`} tile={tile} size={size} />
      ))}
    </span>
  );
}
