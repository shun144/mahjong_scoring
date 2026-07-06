import type { Tile } from "../engine/model";
import type { Problem } from "../data/problem";
import { WIN_TYPE_LABELS } from "./format";
import { TileRow } from "./tiles/TileRow";

/** ラベルを上・対象の牌を下に積んだ1グループ。アガリ牌／ドラ／裏ドラで共通利用する。
    className でグループ単位の追加スタイル（アガリ牌の背景色など）を差し込める。 */
function LabeledTiles({
  label,
  tiles,
  keyPrefix,
  className,
  labelClassName,
}: {
  label: string;
  tiles: readonly Tile[];
  keyPrefix: string;
  className?: string;
  labelClassName?: string;
}) {
  return (
    <div className={className ? `tile-info-group ${className}` : "tile-info-group"}>
      <span className={labelClassName ? `tile-info-label ${labelClassName}` : "tile-info-label"}>
        {label}
      </span>
      {/* 牌の有無に依らず一定サイズの枠。「なし」でも牌1枚分の領域を確保して中央寄せする。 */}
      <div className="tile-info-slot">
        {tiles.length > 0 ? (
          <TileRow tiles={tiles} keyPrefix={keyPrefix} />
        ) : (
          <span className="tile-info-none">なし</span>
        )}
      </div>
    </div>
  );
}

/**
 * アガリ牌・ドラ表示牌・裏ドラ表示牌を、ラベル上／牌下の同じ並びで横に配置するヘッダー。
 * 裏ドラ表示牌はリーチ時のみ表示する（SPEC.md §5.4）。
 */
export function QuizTileHeader({ problem }: { problem: Problem }) {
  const winType = problem.hand.winType;
  return (
    <section className="quiz-tile-header" aria-label="アガリ牌・ドラ表示牌">
      {/* 「アガリ牌」ラベルは色付き枠の外（上）に置き、枠内にツモ/ロンの牌を収める。 */}
      <div className="win-indicator-section">
        <span className="win-indicator-title">アガリ牌</span>
        <LabeledTiles
          label={WIN_TYPE_LABELS[winType]}
          tiles={[problem.hand.winningTile]}
          keyPrefix="winning"
          className={`tile-info-group--${winType}`}
          labelClassName="mj-winning-label"
        />
      </div>
      {/* 「ドラ表示牌」ラベルはグレー枠の外（上）に置き、枠内に表ドラ・裏ドラをまとめる。 */}
      <div className="dora-indicator-section">
        <span className="dora-indicator-title">ドラ表示牌</span>
        <div className="dora-indicator-group">
          <div className="dora-indicator-tiles">
            <LabeledTiles label="表" tiles={problem.doraIndicators} keyPrefix="dora" />
            <LabeledTiles label="裏" tiles={problem.uraDoraIndicators} keyPrefix="uradora" />
          </div>
        </div>
      </div>
    </section>
  );
}
