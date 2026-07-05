import type { Tile } from "../engine/model";
import type { Problem } from "../data/problem";
import { TileRow } from "./tiles/TileRow";

/** ラベルを上・対象の牌を下に積んだ1グループ。アガリ牌／ドラ／裏ドラで共通利用する。 */
function LabeledTiles({
  label,
  tiles,
  keyPrefix,
}: {
  label: string;
  tiles: readonly Tile[];
  keyPrefix: string;
}) {
  return (
    <div className="tile-info-group">
      <span className="tile-info-label">{label}</span>
      {tiles.length > 0 ? (
        <TileRow tiles={tiles} keyPrefix={keyPrefix} />
      ) : (
        <span className="tile-info-none">なし</span>
      )}
    </div>
  );
}

/**
 * アガリ牌・ドラ表示牌・裏ドラ表示牌を、ラベル上／牌下の同じ並びで横に配置するヘッダー。
 * 裏ドラ表示牌はリーチ時のみ表示する（SPEC.md §5.4）。
 */
export function QuizTileHeader({ problem }: { problem: Problem }) {
  return (
    <section className="quiz-tile-header" aria-label="アガリ牌・ドラ表示牌">
      <LabeledTiles label="アガリ牌" tiles={[problem.hand.winningTile]} keyPrefix="winning" />
      <div className="quiz-tile-header-dora-group" style={{ display: "flex" }}>
        <LabeledTiles label="ドラ表" tiles={problem.doraIndicators} keyPrefix="dora" />
        <LabeledTiles label="裏ドラ表" tiles={problem.uraDoraIndicators} keyPrefix="uradora" />
      </div>
    </section>
  );
}
