import type { Meld } from "../../engine/model";
import { TileFace, type TileSize } from "./TileFace";
import "./tiles.css";

export interface MeldGroupProps {
  meld: Meld;
  size?: TileSize;
  keyPrefix?: string;
}

/**
 * 1つの副露（チー/ポン/明槓/暗槓）を描画する。
 * チー/ポン/明槓は「鳴き」なので1枚を横向きに、暗槓は両端を伏せ牌にする。
 */
export function MeldGroup({ meld, size = "md", keyPrefix = "meld" }: MeldGroupProps) {
  if (meld.type === "ankan") {
    return (
      <span className="mj-meld-group">
        {meld.tiles.map((tile, i) => {
          const faceDown = i === 0 || i === meld.tiles.length - 1;
          return (
            <TileFace
              key={`${keyPrefix}-${i}`}
              tile={tile}
              faceDown={faceDown}
              size={size}
            />
          );
        })}
      </span>
    );
  }

  // チー/ポン/明槓は「鳴き」の面子。鳴いた牌の位置は本アプリの採点・学習に影響しないため、
  // 先頭の1枚だけを横向きにして「鳴き」であることを示す（暗槓は上で別処理）。
  return (
    <span className="mj-meld-group">
      {meld.tiles.map((tile, i) => (
        <TileFace key={`${keyPrefix}-${i}`} tile={tile} rotated={i === 0} size={size} />
      ))}
    </span>
  );
}
