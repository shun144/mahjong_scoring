import type { Tile } from "../engine/model";
import type { Problem } from "../data/problem";
import tenbo1000Url from "../assets/tenbo/tenbo-1000.png";
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
 * 符計算モードは符がドラの影響を受けないため、showDora=false でドラ表示を省略できる。
 * showRiichi=true の場合、アガリ牌とドラ表示牌の間にリーチ表示（「リーチ」ラベル＋1000点棒の画像）を
 * 挟む（最終点数モード専用。SPEC.md §4.1「リーチ表示の位置」）。非リーチ時も同じ幅の枠を確保し、
 * ドラ表示牌の位置を動かさないため、常に描画して非リーチ時は visibility:hidden で隠す。
 */
export function QuizTileHeader({
  problem,
  showDora = true,
  showRiichi = false,
}: {
  problem: Problem;
  showDora?: boolean;
  showRiichi?: boolean;
}) {
  const winType = problem.hand.winType;
  return (
    <section className="quiz-tile-header" aria-label="アガリ牌・ドラ表示牌">
      {/* ツモ/ロンの色付き枠にアガリ牌を収める。 */}
      <div className="win-indicator-section">
        <LabeledTiles
          label={WIN_TYPE_LABELS[winType]}
          tiles={[problem.hand.winningTile]}
          keyPrefix="winning"
          className={`tile-info-group--${winType}`}
          labelClassName="mj-winning-label"
        />
      </div>
      {showRiichi &&
        (problem.conditions.riichi ? (
          <div className="riichi-indicator-section">
            <span className="tile-info-label">リーチ</span>
            <img src={tenbo1000Url} alt="" className="riichi-indicator-stick" />
          </div>
        ) : (
          <div className="riichi-indicator-section riichi-indicator-spacer" aria-hidden="true">
            <span className="tile-info-label">リーチ</span>
            <img src={tenbo1000Url} alt="" className="riichi-indicator-stick" />
          </div>
        ))}
      {/* グレー枠に表ドラ・裏ドラをまとめる。 */}
      {showDora && (
        <div className="dora-indicator-section">
          <div className="dora-indicator-group">
            <div className="dora-indicator-tiles">
              <LabeledTiles label="表" tiles={problem.doraIndicators} keyPrefix="dora" />
              <LabeledTiles label="裏" tiles={problem.uraDoraIndicators} keyPrefix="uradora" />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
