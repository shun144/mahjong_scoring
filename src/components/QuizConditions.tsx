import type { Problem } from "../data/problem";
import { WIND_LABELS } from "./format";

/** 局条件（場風・自風・親子・リーチ）のバッジ表示。最終点数モード・符計算モードで共有する。
    上がり方（ツモ/ロン）はアガリ牌のラベルと背景色で示すため、ここには表示しない。 */
export function QuizConditions({
  conditions,
}: {
  conditions: Problem["conditions"];
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
      {conditions.riichi ? (
        <span className="badge badge-riichi">
          <span className="badge-value">リーチ</span>
        </span>
      ) : null}
    </section>
  );
}
