import { ChoiceGrid } from "@/components/ChoiceGrid";
import { ScoreTableDialog, ScoreTableIcon } from "@/components/ScoreTableDialog";
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
    handleBack,
    canGoBack,
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
            className="inline-flex items-center justify-center w-[var(--size-icon-btn)] h-[var(--size-icon-btn)] p-0 border-0 rounded-full bg-fl-teal-bg text-fl-teal-dark cursor-pointer shrink-0 transition-[background] duration-[220ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none hover:bg-[color-mix(in_srgb,var(--color-fl-teal)_20%,var(--color-fl-teal-bg))]"
            onClick={() => setShowScoreTable(true)}
            aria-label="点数早見表を開く"
          >
            <ScoreTableIcon />
          </button>
        }
      />

      <MomentSection stats={stats} />

      <QuizSection effectiveProblem={effectiveProblem} settings={settings} />

      {answered ? (
        <ResultSection
          handleRetry={handleRetry}
          handleNext={handleNext}
          handleBack={handleBack}
          canGoBack={canGoBack}
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
            {canGoBack && <ActionButton label="戻る" icon="←" onClick={handleBack} />}
            <ActionButton label="次へ" icon="→" onClick={handleNext} />
          </div>
        </>
      )}

      <ScoreTableDialog open={showScoreTable} onClose={() => setShowScoreTable(false)} />
    </main>
  );
}
