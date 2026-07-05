import type { Problem } from "../data/problem";
import { TileRow } from "./tiles/TileRow";

/**
 * ドラ表示牌・裏ドラ表示牌（リーチ時のみ）の表示。最終点数モード・符計算モードで共有する。
 * ドラ表示牌は必ず1枚以上ある想定だが（SPEC.md §5.4）、防御的に「なし」表示も残す。
 */
export function DoraSection({ problem }: { problem: Problem }) {
  return (
    <section className="quiz-dora" aria-label="ドラ表示牌">
      <div>
        <span className="dora-label">ドラ表示牌</span>
        {problem.doraIndicators.length > 0 ? (
          <TileRow tiles={problem.doraIndicators} keyPrefix="dora" />
        ) : (
          <span>なし</span>
        )}
      </div>
      {problem.conditions.riichi ? (
        <div>
          <span className="dora-label">裏ドラ表示牌</span>
          {problem.uraDoraIndicators.length > 0 ? (
            <TileRow tiles={problem.uraDoraIndicators} keyPrefix="uradora" />
          ) : (
            <span>なし</span>
          )}
        </div>
      ) : null}
    </section>
  );
}
