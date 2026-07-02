import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Payment } from "../engine/score";
import { generateChoices, paymentKey } from "../generator/distractors";
import { nextProblem } from "../store/nextProblem";
import { recordAnswer } from "../store/statsStore";
import { formatPayment, WIND_LABELS } from "./format";
import { HandDisplay } from "./tiles/HandDisplay";
import { TileRow } from "./tiles/TileRow";
import "./quiz.css";

export function QuizPage() {
  const navigate = useNavigate();
  const [problem] = useState(() => nextProblem());
  const choices = useMemo<Payment[]>(
    () =>
      generateChoices(
        problem.answer.payment,
        {
          han: problem.answer.han,
          fu: problem.answer.fu,
          isDealer: problem.conditions.isDealer,
          winType: problem.hand.winType,
        },
        Math.random,
      ),
    [problem],
  );
  const [selectedIndex, setSelectedIndex] = useState<number | "">("");

  function handleSubmit() {
    if (selectedIndex === "") return;
    const selected = choices[selectedIndex];
    const isCorrect = paymentKey(selected) === paymentKey(problem.answer.payment);
    recordAnswer(problem, isCorrect);
    navigate("/result", { state: { problem, selected, isCorrect } });
  }

  return (
    <main className="page-shell">
      <div className="page-header">
        <h1>出題</h1>
        <Link to="/stats" className="page-header-link">
          成績を見る
        </Link>
      </div>
      <section className="quiz-conditions" aria-label="局条件">
        <span className="badge">場風: {WIND_LABELS[problem.conditions.roundWind]}</span>
        <span className="badge">自風: {WIND_LABELS[problem.conditions.seatWind]}</span>
        <span className="badge">{problem.conditions.isDealer ? "親" : "子"}</span>
        {problem.conditions.riichi ? <span className="badge badge-riichi">リーチ</span> : null}
      </section>

      <section className="quiz-hand">
        <h2>手牌</h2>
        <HandDisplay
          concealed={problem.hand.concealed}
          melds={problem.hand.melds}
          winningTile={problem.hand.winningTile}
          winType={problem.hand.winType}
        />
      </section>

      <section className="quiz-dora" aria-label="ドラ表示牌">
        <div>
          <span className="dora-label">ドラ表示牌</span>
          {problem.doraIndicators.length > 0 ? (
            <TileRow tiles={problem.doraIndicators} size="sm" keyPrefix="dora" />
          ) : (
            <span>なし</span>
          )}
        </div>
        {problem.conditions.riichi ? (
          <div>
            <span className="dora-label">裏ドラ表示牌</span>
            {problem.uraDoraIndicators.length > 0 ? (
              <TileRow tiles={problem.uraDoraIndicators} size="sm" keyPrefix="uradora" />
            ) : (
              <span>なし</span>
            )}
          </div>
        ) : null}
      </section>

      <section className="quiz-answer">
        <label htmlFor="answer-select">点数を選択してください</label>
        <select
          id="answer-select"
          value={selectedIndex}
          onChange={(e) =>
            setSelectedIndex(e.target.value === "" ? "" : Number(e.target.value))
          }
        >
          <option value="">選択してください</option>
          {choices.map((choice, index) => (
            <option key={paymentKey(choice)} value={index}>
              {formatPayment(choice)}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn-primary"
          onClick={handleSubmit}
          disabled={selectedIndex === ""}
        >
          回答する
        </button>
      </section>
    </main>
  );
}
