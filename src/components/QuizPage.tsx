import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { resolveAnswer, type Problem } from "../data/problem";
import type { Payment } from "../engine/score";
import { generateChoices, paymentKey } from "../generator/distractors";
import { createSeededRandom, seedFromString } from "../generator/random";
import { useSettings } from "../settings/SettingsContext";
import { nextProblem } from "../store/nextProblem";
import { recordAnswer } from "../store/statsStore";
import { ChoiceGrid } from "./ChoiceGrid";
import { formatPayment } from "./format";
import { SidebarPageHeader } from "./SidebarPageHeader";
import "./quiz.css";
import "./quizFlip7.css";
import { QuizConditions } from "./QuizConditions";
import { ScoreTableDialog } from "./ScoreTableDialog";
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
  // 点数早見表ダイアログの開閉。
  const [showScoreTable, setShowScoreTable] = useState(false);
  // 切り上げ満貫設定を反映した実効問題。設定ロード完了前はfalse相当（標準ルール）で表示する。
  const effectiveProblem = useMemo(
    () => resolveAnswer(problem, settings.roundUpMangan),
    [problem, settings.roundUpMangan],
  );
  // 選択肢のシャッフルは問題IDから決定的に導出する。成績画面を経由して戻ってくるなど、
  // 同じ問題で画面が再マウントされても4択の内容・並び順が変わらないようにするため
  // （Math.randomだと再マウントのたびに再シャッフルされてしまう）。
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
        createSeededRandom(seedFromString(effectiveProblem.id)),
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
    <main className="page-shell quiz-page">
      <SidebarPageHeader
        title="点数計算"
        currentMode="score"
        backTo="/quiz"
        problem={problem}
        headerAction={
          <button
            type="button"
            className="qp-table-header-btn"
            onClick={() => setShowScoreTable(true)}
            aria-label="点数早見表を開く"
          >
            <span aria-hidden="true">📋</span>
          </button>
        }
      />
      <QuizConditions
        conditions={effectiveProblem.conditions}
        roundUpMangan={settings.roundUpMangan}
        showRiichi={false}
      />

      {/* アガリ牌・ドラ・手牌をひとつの「盤面」パネルにまとめて提示する（Flip7 の play mat）。 */}
      <section className="qp-board" aria-label="問題">
        <QuizTileHeader problem={effectiveProblem} showRiichi />

        <div className="quiz-hand">
          <span className="qp-section-label">手牌</span>
          <HandDisplay
            concealed={effectiveProblem.hand.concealed}
            melds={effectiveProblem.hand.melds}
            winningTile={effectiveProblem.hand.winningTile}
          />
        </div>
      </section>

      <section className="quiz-answer">
        <p className="quiz-answer-label">
          <span className="qp-answer-icon" aria-hidden="true">
            🎯
          </span>
          点数を選んでください
        </p>
        <ChoiceGrid
          items={choices}
          keyOf={paymentKey}
          renderLabel={formatPayment}
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

      <ScoreTableDialog open={showScoreTable} onClose={() => setShowScoreTable(false)} />
    </main>
  );
}
