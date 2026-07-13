import type { Tile } from "../../engine/model";
import { TileRow } from "../tiles/TileRow";

export interface ArticleHandProps {
  hand: readonly Tile[];
  winningTile?: Tile;
  menzen?: string;
  naki?: string;
}

/** 鳴き翻の値が「不成立（門前のみ等）」を表すか。 */
function isNakiNone(value: string): boolean {
  const v = value.trim();
  return v === "" || v === "-" || v === "×" || v === "x" || v === "なし";
}

/** 翻数ラベルを整形する（数字なら "N翻"、それ以外はそのまま）。 */
function formatHan(value: string): string {
  const v = value.trim();
  return /^\d+$/.test(v) ? `${v}翻` : v;
}

/**
 * 記事内の牌姿（手牌図）。クイズ画面と同じ牌画像コンポーネントで描画する。
 * あがり牌も手牌と区別せず、同じ大きさ・区切りなしで一列に並べる。
 */
export function ArticleHand({ hand, winningTile, menzen, naki }: ArticleHandProps) {
  const showBadges = menzen !== undefined || naki !== undefined;
  const tiles = winningTile ? [...hand, winningTile] : hand;

  return (
    <div className="article-hand">
      {showBadges && (
        <div className="article-hand-badges">
          {menzen !== undefined && (
            <span className="article-han-badge article-han-badge--menzen">
              <span className="article-han-badge-label">門前</span>
              <span className="article-han-badge-value">{formatHan(menzen)}</span>
            </span>
          )}
          {naki !== undefined && (
            <span
              className={`article-han-badge ${
                isNakiNone(naki) ? "article-han-badge--none" : "article-han-badge--naki"
              }`}
            >
              <span className="article-han-badge-label">鳴き</span>
              <span className="article-han-badge-value">
                {isNakiNone(naki) ? "なし" : formatHan(naki)}
              </span>
            </span>
          )}
        </div>
      )}
      <div className="article-hand-tiles">
        <TileRow tiles={tiles} keyPrefix="article-hand" />
      </div>
    </div>
  );
}
