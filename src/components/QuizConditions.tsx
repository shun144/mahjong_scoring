import type { Problem } from "../data/problem";
import { WIND_LABELS } from "./format";

/** 局条件（場風・自風・親子・リーチ）のバッジ表示。最終点数モード・符計算モードで共有する。
    上がり方（ツモ/ロン）はアガリ牌のラベルと背景色で示すため、ここには表示しない。
    roundUpMangan（切り上げ満貫設定）は点数計算モードのみ渡され、有効時は先頭にタグを出す。
    showRiichi=false（既定true）を渡すと、リーチ中の問題でもリーチバッジを表示しない
    （符分解モード専用。符に無関係なリーチ表示を省く。SPEC.md §4.10）。 */
export function QuizConditions({
  conditions,
  roundUpMangan,
  showRiichi = true,
}: {
  conditions: Problem["conditions"];
  roundUpMangan?: boolean;
  showRiichi?: boolean;
}) {
  return (
    <section className="quiz-conditions" aria-label="局条件">
      {roundUpMangan ? (
        <span className="badge badge--roundup">
          <span className="badge-value">満貫切上</span>
        </span>
      ) : null}
      <span
        className="badge badge--windset"
        aria-label={`場風${WIND_LABELS[conditions.roundWind]} 自風${WIND_LABELS[conditions.seatWind]}`}
      >
        <span className="badge-value">{WIND_LABELS[conditions.roundWind]}</span>
        <span className="badge-label">場</span>
        <span className="badge-value">{WIND_LABELS[conditions.seatWind]}</span>
        <span className="badge-label">家</span>
      </span>
      <span className="badge badge--dealer">
        <span className="badge-value">{conditions.isDealer ? "親" : "子"}</span>
      </span>
      {showRiichi && conditions.riichi ? (
        <span className="badge badge-riichi">
          <span className="badge-value">リーチ</span>
        </span>
      ) : null}
    </section>
  );
}
