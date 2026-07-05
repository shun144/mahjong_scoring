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
      <span className="badge">場風: {WIND_LABELS[conditions.roundWind]}</span>
      <span className="badge">自風: {WIND_LABELS[conditions.seatWind]}</span>
      <span className="badge">{conditions.isDealer ? "親" : "子"}</span>
      <span className="badge">{WIN_TYPE_LABELS[winType]}</span>
      {conditions.riichi ? <span className="badge badge-riichi">リーチ</span> : null}
    </section>
  );
}
