import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { Problem } from "../data/problem";
import type { Payment } from "../engine/score";
import { generateChoices, paymentKey } from "../generator/distractors";
import { nextProblem } from "../store/nextProblem";
import { recordAnswer } from "../store/statsStore";
import { ChoiceGrid } from "./ChoiceGrid";
import { DoraSection } from "./DoraSection";
import { formatPayment } from "./format";
import { QuizConditions } from "./QuizConditions";
import { HandDisplay } from "./tiles/HandDisplay";
import "./quiz.css";
import { PageHeader } from "./PageHeader";

/** 解説画面から「問題に戻る」で渡される復習用の遷移 state。 */
function isReviewState(state: unknown): state is { problem: Problem; review: boolean } {
  return !!state && typeof state === "object" && "problem" in state && "review" in state;
}

export function QuizPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // 解説から「問題に戻る」で来た場合は同じ問題を再表示する。復習なので成績は記録しない。
  const [reviewProblem, setReviewProblem] = useState(() =>
    isReviewState(location.state) ? location.state.problem : null,
  );
  const [problem, setProblem] = useState(() => reviewProblem ?? nextProblem());
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
  function handleAnswer(selected: Payment) {
    const isCorrect = paymentKey(selected) === paymentKey(problem.answer.payment);
    if (!reviewProblem) recordAnswer(problem, isCorrect); // 復習（同じ問題の再回答）は二重計上しない
    navigate("/result", { state: { problem, selected, isCorrect } });
  }

  // 回答せずに次の問題へスキップする。成績には一切記録しない（回答数にもカウントしない）。
  function handleSkip() {
    setReviewProblem(null);
    setProblem(nextProblem());
  }

  return (
    <main className="page-shell">
      <PageHeader title="出題" />
      <QuizConditions conditions={problem.conditions} />

      <section className="quiz-hand">
        <HandDisplay
          concealed={problem.hand.concealed}
          melds={problem.hand.melds}
          winningTile={problem.hand.winningTile}
          winType={problem.hand.winType}
        />
      </section>

      <DoraSection problem={problem} />

      <section className="quiz-answer">
        <p className="quiz-answer-label">点数を選んでください</p>
        <ChoiceGrid
          items={choices}
          keyOf={paymentKey}
          renderLabel={formatPayment}
          onSelect={handleAnswer}
        />
      </section>

      <section className="quiz-skip">
        <button type="button" className="btn-secondary" onClick={handleSkip}>
          次の問題へ
        </button>
      </section>
    </main>
  );
}
