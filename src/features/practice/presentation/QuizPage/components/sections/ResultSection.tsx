import type { Problem } from "@/features/practice/domain/problem";
import { ActionButton } from "../ActionButton";
import { QuizResultContent } from "./QuizResultContent";

interface Props {
  handleRetry: () => void;
  handleNext: () => void;
  handleBack: () => void;
  canGoBack: boolean;
  effectiveProblem: Problem;
  isCorrect: boolean;
}

function ResultSection({
  handleRetry,
  handleNext,
  handleBack,
  canGoBack,
  effectiveProblem,
  isCorrect,
}: Props) {
  return (
    <section className="flex flex-col gap-5" aria-label="結果表示">
      <div className="flex justify-center gap-3">
        {canGoBack && <ActionButton label="戻る" icon="←" onClick={handleBack} />}
        <ActionButton label="もう一度" icon="↻" onClick={handleRetry} />
        <ActionButton label="次へ" icon="→" onClick={handleNext} />
      </div>

      <QuizResultContent problem={effectiveProblem} isCorrect={isCorrect} />
    </section>
  );
}

export { ResultSection };
