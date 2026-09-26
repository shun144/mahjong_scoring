import type { Meld } from "@/core/scoring/domain/meld";
import { removeOneMatchingTile, sortTiles, type Tile } from "@/core/scoring/domain/tile";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { MeldGroup } from "./MeldGroup";
import type { TileSize } from "./TileFace";
import { TileRow } from "./TileRow";
import "./tiles.css";

export interface HandDisplayProps {
  /** 純手牌（副露を除く。上がり牌を含む完成形）。 */
  concealed: readonly Tile[];
  /** 副露（あれば横向きで表示）。 */
  melds?: readonly Meld[];
  /** 上がり牌。並びからは1枚除外する（アガリ牌は上部ヘッダーで別途表示するため重複させない）。 */
  winningTile: Tile;
  size?: TileSize;
}

/**
 * 手牌（純手牌＋副露）を表示するコンポーネント。SPEC.md §4.1 の出題情報のうち手牌部分に対応。
 * 上がり牌は QuizTileHeader 側で表示するため、ここでは concealed から1枚除外して並べる。
 */
export function HandDisplay({ concealed, melds = [], winningTile, size = "md" }: HandDisplayProps) {
  // concealed には上がり牌が含まれるため、ヘッダーのアガリ牌表示と重複しないよう1枚取り除く。
  const restTiles = removeOneMatchingTile(concealed, winningTile);
  const sortedConcealed = sortTiles(restTiles);

  const scrollRef = useRef<HTMLDivElement>(null);
  // 横スクロールバーは非表示にしている（tiles.css）ため、まだ隠れている牌がある方向を
  // フェードで示す。スクロールバーが無くても続きがあることが分かるようにするため。
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateFadeState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  // 問題が変わる・画面サイズが変わるなど、スクロール要否が変わりうるタイミングで再計算する。
  useLayoutEffect(() => {
    updateFadeState();
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateFadeState, { passive: true });
    const observer = new ResizeObserver(updateFadeState);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", updateFadeState);
      observer.disconnect();
    };
  }, [updateFadeState]);

  return (
    <div className="mj-hand-display" ref={scrollRef}>
      {/* 純手牌の行。 */}
      <div className="mj-hand-row">
        <TileRow tiles={sortedConcealed} size={size} keyPrefix="concealed" />
      </div>
      {/* 副露は手牌の下の行に横1列で並べる。鳴きが無くても行自体は残し、
          min-height でスペースを確保して手牌ブロックの高さを揃える。 */}
      <div className="mj-meld-row">
        {melds.map((meld, i) => (
          <MeldGroup key={`meld-${i}`} meld={meld} size={size} keyPrefix={`meld-${i}`} />
        ))}
      </div>
      <div
        className={`mj-hand-fade mj-hand-fade--left${canScrollLeft ? " mj-hand-fade--visible" : ""}`}
        aria-hidden="true"
      />
      <div
        className={`mj-hand-fade mj-hand-fade--right${canScrollRight ? " mj-hand-fade--visible" : ""}`}
        aria-hidden="true"
      />
    </div>
  );
}
