import { ChoiceGrid } from "@/components/ChoiceGrid";
import { ScoreTableDialog } from "@/components/ScoreTableDialog";
import { SidebarPageHeader } from "@/components/SidebarPageHeader";
import { paymentKey } from "@/features/practice/application/distractors";
import { formatPayment } from "../format";
import "../quiz.css";
import { ActionButton } from "./components/ActionButton";
import { MomentSection } from "./components/sections/MomentSection";
import { QuizSection } from "./components/sections/QuizSection";
import { ResultSection } from "./components/sections/ResultSection";
import { useQuizPageHook } from "./hooks/useQuizPageHook";

export function QuizPage() {
  const {
    problem,
    setShowScoreTable,
    stats,
    effectiveProblem,
    settings,
    answered,
    handleRetry,
    handleNext,
    choices,
    handleAnswer,
    showScoreTable,
  } = useQuizPageHook();

  return (
    <main className="quiz-page max-w-[40rem] mx-auto flex flex-col gap-5 p-4 sm:p-6 ">
      <SidebarPageHeader
        title="点数計算"
        currentMode="score"
        problem={problem}
        headerAction={
          <button
            type="button"
            className="inline-flex items-center justify-center w-10 h-10 p-0 text-[1.2rem] leading-none border-0 rounded-full bg-transparent text-fl-teal-dark cursor-pointer shrink-0 transition-[background] duration-[220ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:bg-[rgba(43,168,162,0.14)]"
            onClick={() => setShowScoreTable(true)}
            aria-label="点数早見表を開く"
          >
            <span aria-hidden="true">📋</span>
          </button>
        }
      />

      <MomentSection stats={stats} />

      <QuizSection effectiveProblem={effectiveProblem} settings={settings} />

      {answered ? (
        <ResultSection
          handleRetry={handleRetry}
          handleNext={handleNext}
          effectiveProblem={effectiveProblem}
          isCorrect={answered.isCorrect}
        />
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

          <div className="flex justify-center gap-3">
            <ActionButton label="次の問題へ" icon="→" onClick={handleNext} />
          </div>
        </>
      )}

      <ScoreTableDialog open={showScoreTable} onClose={() => setShowScoreTable(false)} />
    </main>
  );
}
