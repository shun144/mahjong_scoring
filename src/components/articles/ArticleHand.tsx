import type { Tile } from "../../engine/model";
import { TileRow } from "../tiles/TileRow";

export interface ArticleHandProps {
  hand: readonly Tile[];
  winningTile?: Tile;
  menzen?: string;
  naki?: string;
}

const BADGE_CLASS =
  "inline-flex items-center gap-1.5 py-[3px] px-2.5 text-[0.78rem] font-extrabold rounded-[var(--fl-r-pill)] border-2";
const BADGE_LABEL_CLASS = "text-[0.68rem] font-bold opacity-85";

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
    <div className="flex flex-col gap-2 mx-[-20px] py-2 border-y-2 border-[rgba(43,168,162,0.28)] bg-fl-cream">
      {showBadges && (
        <div className="flex flex-wrap gap-2 px-[6px]">
          {menzen !== undefined && (
            <span className={`${BADGE_CLASS} text-fl-teal-dark bg-fl-teal-bg border-[rgba(43,168,162,0.4)]`}>
              <span className={BADGE_LABEL_CLASS}>門前</span>
              <span>{formatHan(menzen)}</span>
            </span>
          )}
          {naki !== undefined && (
            <span
              className={`${BADGE_CLASS} ${
                isNakiNone(naki)
                  ? "text-fl-muted bg-[#eef1f1] border-[rgba(86,109,107,0.28)]"
                  : "text-fl-gold-dark bg-[#fff6d6] border-[rgba(230,184,0,0.5)]"
              }`}
            >
              <span className={BADGE_LABEL_CLASS}>鳴き</span>
              <span>{isNakiNone(naki) ? "なし" : formatHan(naki)}</span>
            </span>
          )}
        </div>
      )}
      {/* 牌行(.mj-tile-wrap/.mj-tile-row)は共有コンポーネント(TileRow/TileFace)の内部要素で、
          外側からclassNameを渡せないため、幅の流動化はarticles.cssのCSS上書き
          （article-hand-tiles スコープ）で行う（STYLE-TRANSFER.md R5-5）。 */}
      <div className="article-hand-tiles flex items-end flex-nowrap min-w-0 px-1">
        <TileRow tiles={tiles} keyPrefix="article-hand" />
      </div>
    </div>
  );
}
