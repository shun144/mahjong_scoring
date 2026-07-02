import type { Meld, Tile } from "../../engine/model";
import { removeOneMatchingTile, sortTiles } from "../../engine/tiles";
import { MeldGroup } from "./MeldGroup";
import { TileFace, type TileSize } from "./TileFace";
import { TileRow } from "./TileRow";
import "./tiles.css";

export interface HandDisplayProps {
  /** 純手牌（副露を除く。上がり牌を含む完成形）。 */
  concealed: readonly Tile[];
  /** 副露（あれば横向きで表示）。 */
  melds?: readonly Meld[];
  /** 上がり牌。純手牌の右側に区切って強調表示する（concealed内の1枚を差し替えて表示する）。 */
  winningTile: Tile;
  size?: TileSize;
}

/**
 * 手牌全体（純手牌＋上がり牌＋副露）を表示するコンポーネント。
 * SPEC.md §4.1 の出題情報のうち手牌部分に対応。
 */
export function HandDisplay({ concealed, melds = [], winningTile, size = "md" }: HandDisplayProps) {
  // concealed には上がり牌が既に含まれているため、強調表示の1枚と重複しないよう取り除く。
  const restTiles = removeOneMatchingTile(concealed, winningTile);
  const sortedConcealed = sortTiles(restTiles);

  return (
    <div className="mj-hand-display">
      <TileRow tiles={sortedConcealed} size={size} keyPrefix="concealed" />
      <span className="mj-winning-tile">
        <TileFace tile={winningTile} size={size} />
      </span>
      {melds.map((meld, i) => (
        <MeldGroup key={`meld-${i}`} meld={meld} size={size} keyPrefix={`meld-${i}`} />
      ))}
    </div>
  );
}
