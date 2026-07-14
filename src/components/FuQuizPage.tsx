import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { problemToScoreHandInput, type Problem } from "../data/problem";
import { scoreHand } from "../engine/scoreHand";
import { generateFuChoices } from "../generator/distractors";
import { createSeededRandom, seedFromString } from "../generator/random";
import { nextProblem } from "../store/nextProblem";
import { recordAnswer } from "../store/statsStore";
import { ChoiceGrid } from "./ChoiceGrid";
import { SidebarPageHeader } from "./SidebarPageHeader";
import "./quiz.css";
import "./quizFlip7.css";
import { QuizConditions } from "./QuizConditions";
import { QuizTileHeader } from "./QuizTileHeader";
import { HandDisplay } from "./tiles/HandDisplay";

/** 解説画面から「問題に戻る」で渡される復習用の遷移 state。 */
function isReviewState(state: unknown): state is { problem: Problem; review: boolean } {
  return !!state && typeof state === "object" && "problem" in state && "review" in state;
}

export function FuQuizPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // 解説から「問題に戻る」で来た場合は同じ問題を再表示する。復習なので成績は記録しない。
  const [reviewProblem, setReviewProblem] = useState(() =>
    isReviewState(location.state) ? location.state.problem : null,
  );
  // 符計算モードでは満貫以上（符が点数に影響しない区分）を出題しない（SPEC.md §4.0）。
  const [problem, setProblem] = useState(
    () => reviewProblem ?? nextProblem(Math.random, { excludeMangan: true }),
  );

  // バンク問題は fuDetail 未保存の可能性があるため、無ければエンジンで再計算する（決定的）。
  const fuDetail = useMemo(
    () => problem.answer.fuDetail ?? scoreHand(problemToScoreHandInput(problem))?.fuDetail,
    [problem],
  );
  // 選択肢のシャッフルは問題IDから決定的に導出する（QuizPageと同じ理由。成績画面を
  // 経由して戻ってきても4択の内容・並び順が変わらないようにする）。
  const choices = useMemo<number[]>(
    () =>
      fuDetail
        ? generateFuChoices(fuDetail, createSeededRandom(seedFromString(problem.id)))
        : [problem.answer.fu],
    [problem, fuDetail],
  );

  function handleAnswer(selected: number) {
    const isCorrect = selected === problem.answer.fu;
    if (!reviewProblem) recordAnswer(problem, isCorrect); // 復習（同じ問題の再回答）は二重計上しない
    navigate("/fu/result", { state: { problem, selected, isCorrect } });
  }

  // 回答せずに次の問題へスキップする。成績には一切記録しない（回答数にもカウントしない）。
  function handleSkip() {
    setReviewProblem(null);
    setProblem(nextProblem(Math.random, { excludeMangan: true }));
  }

  return (
    <main className="page-shell quiz-page">
      <SidebarPageHeader title="符計算" backTo="/fu/quiz" problem={problem} />
      <QuizConditions conditions={problem.conditions} showRiichi={false} />

      {/* アガリ牌・ドラ・手牌をひとつの「盤面」パネルにまとめて提示する（Flip7 の play mat）。 */}
      <section className="qp-board" aria-label="問題">
        <QuizTileHeader problem={problem} showDora={false} showRiichi />

        <div className="quiz-hand">
          <span className="qp-section-label">手牌</span>
          <HandDisplay
            concealed={problem.hand.concealed}
            melds={problem.hand.melds}
            winningTile={problem.hand.winningTile}
          />
        </div>
      </section>

      <section className="quiz-answer">
        <p className="quiz-answer-label">
          <span className="qp-answer-icon" aria-hidden="true">
            🎯
          </span>
          符を選んでください
        </p>
        <ChoiceGrid
          items={choices}
          keyOf={(fu) => String(fu)}
          renderLabel={(fu) => `${fu}符`}
          onSelect={handleAnswer}
        />
      </section>

      <section className="quiz-skip">
        <button type="button" className="qp-skip-btn" onClick={handleSkip}>
          次の問題へ
          <span className="qp-skip-arrow" aria-hidden="true">
            ↻
          </span>
        </button>
      </section>
    </main>
  );
}
