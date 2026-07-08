import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { resolveAnswer, type Problem } from "../data/problem";
import type { Payment } from "../engine/score";
import { generateChoices, paymentKey } from "../generator/distractors";
import { useSettings } from "../settings/SettingsContext";
import { nextProblem } from "../store/nextProblem";
import { recordAnswer } from "../store/statsStore";
import { ChoiceGrid } from "./ChoiceGrid";
import { formatPayment } from "./format";
import { PageHeader } from "./PageHeader";
import "./quiz.css";
import { QuizConditions } from "./QuizConditions";
import { QuizTileHeader } from "./QuizTileHeader";
import { HandDisplay } from "./tiles/HandDisplay";

/** 解説画面から「問題に戻る」で渡される復習用の遷移 state。 */
function isReviewState(state: unknown): state is { problem: Problem; review: boolean } {
  return !!state && typeof state === "object" && "problem" in state && "review" in state;
}

export function QuizPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings();
  // 解説から「問題に戻る」で来た場合は同じ問題を再表示する。復習なので成績は記録しない。
  const [reviewProblem, setReviewProblem] = useState(() =>
    isReviewState(location.state) ? location.state.problem : null,
  );
  const [problem, setProblem] = useState(() => reviewProblem ?? nextProblem());
  // 切り上げ満貫設定を反映した実効問題。設定ロード完了前はfalse相当（標準ルール）で表示する。
  const effectiveProblem = useMemo(
    () => resolveAnswer(problem, settings.roundUpMangan),
    [problem, settings.roundUpMangan],
  );
  const choices = useMemo<Payment[]>(
    () =>
      generateChoices(
        effectiveProblem.answer.payment,
        {
          han: effectiveProblem.answer.han,
          fu: effectiveProblem.answer.fu,
          isDealer: effectiveProblem.conditions.isDealer,
          winType: effectiveProblem.hand.winType,
        },
        Math.random,
      ),
    [effectiveProblem],
  );
  function handleAnswer(selected: Payment) {
    const isCorrect = paymentKey(selected) === paymentKey(effectiveProblem.answer.payment);
    if (!reviewProblem) recordAnswer(problem, isCorrect); // 復習（同じ問題の再回答）は二重計上しない
    navigate("/result", { state: { problem: effectiveProblem, selected, isCorrect } });
  }

  // 回答せずに次の問題へスキップする。成績には一切記録しない（回答数にもカウントしない）。
  function handleSkip() {
    setReviewProblem(null);
    setProblem(nextProblem());
  }

  return (
    <main className="page-shell">
      <PageHeader title="出題" />
      <QuizConditions conditions={effectiveProblem.conditions} roundUpMangan={settings.roundUpMangan} />

      <QuizTileHeader problem={effectiveProblem} />

      <section className="quiz-hand">
        <HandDisplay
          concealed={effectiveProblem.hand.concealed}
          melds={effectiveProblem.hand.melds}
          winningTile={effectiveProblem.hand.winningTile}
        />
      </section>

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
