import type { Tile } from "../../engine/model";
import { tileToLabel } from "../../engine/tiles";
import { backUrl, frontUrl, markUrl } from "./tileAssets";
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

function wrapClassName(size: TileSize, rotated: boolean, className?: string): string {
  return ["mj-tile-wrap", `mj-tile-size-${size}`, rotated ? "mj-tile-rotated" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");
}

/**
 * 1枚の牌を実物SVGアセットで描画する表示コンポーネント。
 * 地（Front.svg）の上に絵柄SVGを重ねる。伏せ牌は単体完結のBack.svgを使う。
 * 各SVGは同一IDを持つため必ず別々の <img> として重ね、a11yツリーには
 * ラッパspan（role="img"）だけを残す（内側imgは alt="" で装飾扱い）。
 */
export function TileFace({ tile, rotated = false, faceDown, size = "md", className }: TileFaceProps) {
  if (faceDown) {
    return (
      <span className={wrapClassName(size, rotated, className)} role="img" aria-label="伏せ牌">
        <span className="mj-tile-inner">
          <img className="mj-tile-layer" src={backUrl} alt="" />
        </span>
      </span>
    );
  }

  const label = tileToLabel(tile);

  return (
    <span className={wrapClassName(size, rotated, className)} role="img" aria-label={label}>
      <span className="mj-tile-inner">
        <img className="mj-tile-layer" src={frontUrl} alt="" />
        <img className="mj-tile-layer mj-tile-mark" src={markUrl(tile)} alt="" />
      </span>
    </span>
  );
}
