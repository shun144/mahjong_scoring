import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { resolveAnswer, type Problem } from "../data/problem";
import type { Payment } from "../engine/score";
import { generateChoices, paymentKey } from "../generator/distractors";
import { createSeededRandom, seedFromString } from "../generator/random";
import { useSettings } from "../settings/SettingsContext";
import { nextProblem } from "../store/nextProblem";
import { recordAnswer } from "../store/statsStore";
import { ChoiceGrid } from "./ChoiceGrid";
import { formatPayment } from "./format";
import { ResultContent } from "./ResultContent";
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

interface Answered {
  selected: Payment;
  isCorrect: boolean;
}

export function QuizPage() {
  const location = useLocation();
  const { settings } = useSettings();
  // 解説から「問題に戻る」で来た場合は同じ問題を再表示する。復習なので成績は記録しない。
  const [reviewProblem, setReviewProblem] = useState(() =>
    isReviewState(location.state) ? location.state.problem : null,
  );
  const [problem, setProblem] = useState(() => reviewProblem ?? nextProblem());
  // 回答結果。null=未回答（選択肢を表示）、非nullなら同画面に結果をインライン表示する。
  const [answered, setAnswered] = useState<Answered | null>(null);
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
    if (answered) return; // 同一問題の結果表示中は再回答を計上しない
    const isCorrect = paymentKey(selected) === paymentKey(effectiveProblem.answer.payment);
    if (!reviewProblem) recordAnswer(problem, isCorrect); // 復習（同じ問題の再回答）は二重計上しない
    setAnswered({ selected, isCorrect });
  }

  // 次の問題へ進む。未回答時は「次の問題へ」スキップ、回答後は結果からの「次へ」で使う。
  // いずれも成績には記録しない（記録は handleAnswer で1回のみ行う）。
  function handleNext() {
    setAnswered(null);
    setReviewProblem(null);
    setProblem(nextProblem());
  }

  // 回答後、同じ問題を回答・採点状態だけリセットして解き直す。「問題に戻る」と同じ復習扱いにし、
  // 再回答を成績に二重計上しない（handleAnswer の reviewProblem ガードを流用）。
  function handleRetry() {
    if (!answered) return;
    setReviewProblem(problem);
    setAnswered(null);
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
          <HandDisplay
            concealed={effectiveProblem.hand.concealed}
            melds={effectiveProblem.hand.melds}
            winningTile={effectiveProblem.hand.winningTile}
          />
        </div>
      </section>

      {answered ? (
        <>
          <section className="quiz-skip">
            <button type="button" className="qp-skip-btn" onClick={handleRetry}>
              もう一度
              <span className="qp-skip-arrow" aria-hidden="true">
                ↻
              </span>
            </button>
            <button type="button" className="qp-skip-btn" onClick={handleNext}>
              次の問題へ
              <span className="qp-skip-arrow" aria-hidden="true">
                →
              </span>
            </button>
          </section>

          <section className="quiz-answer" aria-label="結果">
            <ResultContent problem={effectiveProblem} isCorrect={answered.isCorrect} collapsible />
          </section>
        </>
      ) : (
        <>
          <section className="quiz-answer">
            <ChoiceGrid
              items={choices}
              keyOf={paymentKey}
              renderLabel={formatPayment}
              onSelect={handleAnswer}
            />
          </section>

          <section className="quiz-skip">
            <button type="button" className="qp-skip-btn" onClick={handleNext}>
              次の問題へ
              <span className="qp-skip-arrow" aria-hidden="true">
                →
              </span>
            </button>
          </section>
        </>
      )}

      <ScoreTableDialog open={showScoreTable} onClose={() => setShowScoreTable(false)} />
    </main>
  );
}
