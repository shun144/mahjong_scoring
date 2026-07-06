import type { WinType } from "../engine/model";
import type { Problem } from "../data/problem";
import { WIN_TYPE_LABELS, WIND_LABELS } from "./format";

/** 局条件（場風・自風・親子・リーチ・上がり方）のバッジ表示。最終点数モード・符計算モードで共有する。 */
export function QuizConditions({
  conditions,
  winType,
}: {
  conditions: Problem["conditions"];
  winType: WinType;
}) {
  return (
    <section className="quiz-conditions" aria-label="局条件">
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
      <span className="badge badge--wintype">
        <span className="badge-value">{WIN_TYPE_LABELS[winType]}</span>
      </span>
      {conditions.riichi ? (
        <span className="badge badge-riichi">
          <span className="badge-value">リーチ</span>
        </span>
      ) : null}
    </section>
  );
}
