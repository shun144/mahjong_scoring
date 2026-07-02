import type { Meld } from "../../engine/model";
import { tilesEqual } from "../../engine/tiles";
import { TileFace, type TileSize } from "./TileFace";
import "./tiles.css";

export interface MeldGroupProps {
  meld: Meld;
  size?: TileSize;
  keyPrefix?: string;
}

/**
 * 1つの副露（チー/ポン/明槓/暗槓）を描画する。
 * 鳴いた牌（calledTile）は横向きに、暗槓は両端を伏せ牌にする。
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

  const calledIndex = meld.calledTile
    ? meld.tiles.findIndex((t) => tilesEqual(t, meld.calledTile!))
    : -1;

  return (
    <span className="mj-meld-group">
      {meld.tiles.map((tile, i) => (
        <TileFace
          key={`${keyPrefix}-${i}`}
          tile={tile}
          rotated={i === calledIndex}
          size={size}
        />
      ))}
    </span>
  );
}
