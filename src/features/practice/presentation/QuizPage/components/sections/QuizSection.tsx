import { HandDisplay } from "@/components/tiles/HandDisplay";
import type { Problem } from "@/features/practice/domain/problem";
import { QuizConditions } from "@/features/practice/presentation/QuizConditions";
import { QuizTileHeader } from "@/features/practice/presentation/QuizTileHeader";
import type { AppSettings } from "@/features/settings/domain/appSettings";

interface Props {
  effectiveProblem: Problem;
  settings: AppSettings;
}

function QuizSection({ effectiveProblem, settings }: Props) {
  return (
    <section aria-label="問題" className="flex flex-col gap-1">
      <QuizConditions
        conditions={effectiveProblem.conditions}
        roundUpMangan={settings.roundUpMangan}
        showRiichi={false}
      />

      <section
        className="flex flex-col gap-[18px] px-4 py-[18px] bg-fl-teal-bg border-2 border-[rgba(43,168,162,0.2)] rounded-[var(--fl-r-lg)] shadow-[var(--fl-glow-teal-soft)] overflow-x-visible animate-[qp-rise_420ms_var(--fl-bounce)_both] motion-reduce:animate-none"
        aria-label="牌姿"
      >
        <QuizTileHeader problem={effectiveProblem} showRiichi />
        <div className="quiz-hand">
          <HandDisplay
            concealed={effectiveProblem.hand.concealed}
            melds={effectiveProblem.hand.melds}
            winningTile={effectiveProblem.hand.winningTile}
          />
        </div>
      </section>
    </section>
  );
}

export { QuizSection };
