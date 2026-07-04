import type { Problem } from "../data/problem";
import { WIND_LABELS } from "./format";

/** 局条件（場風・自風・親子・リーチ）のバッジ表示。最終点数モード・符計算モードで共有する。 */
export function QuizConditions({ conditions }: { conditions: Problem["conditions"] }) {
  return (
    <section className="quiz-conditions" aria-label="局条件">
      <span className="badge">場風: {WIND_LABELS[conditions.roundWind]}</span>
      <span className="badge">自風: {WIND_LABELS[conditions.seatWind]}</span>
      <span className="badge">{conditions.isDealer ? "親" : "子"}</span>
      {conditions.riichi ? <span className="badge badge-riichi">リーチ</span> : null}
    </section>
  );
}
