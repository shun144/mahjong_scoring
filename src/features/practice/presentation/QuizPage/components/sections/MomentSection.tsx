import { getTodayAnswered, type StatsState } from "@/features/practice/application/statsStore";

interface Props {
  stats: StatsState;
}

function MomentSection({ stats }: Props) {
  return (
    <section className="flex items-baseline gap-[var(--space-5)]" aria-label="今回の記録">
      <div className="flex items-baseline gap-[var(--space-1)]">
        <strong
          data-testid="momentum-today"
          className="text-[length:var(--fs-score)] font-extrabold font-numeric tabular-nums text-text leading-none"
        >
          {getTodayAnswered(stats)}
        </strong>
        <span className="text-sm text-text-sub">今日の回答数</span>
      </div>
      <div className="flex items-baseline gap-[var(--space-1)]">
        <strong
          data-testid="momentum-streak"
          className="text-base font-bold font-numeric tabular-nums text-text-sub leading-none"
        >
          {stats.currentStreak}
        </strong>
        <span className="text-sm text-text-sub">連続正解</span>
      </div>
    </section>
  );
}

export { MomentSection };
