import { useState } from "react";
import { problemToScoreHandInput, type Problem } from "@/features/practice/domain/problem";
import { scoreHand } from "@/core/scoring/domain/score/scoreHandService";
import { FuBreakdownContent } from "@/features/practice/presentation/FuBreakdown";
import { formatCalculationLine, formatPayment } from "@/features/practice/presentation/format";

interface Props {
  problem: Problem;
  isCorrect: boolean;
}

export function QuizResultContent({ problem, isCorrect }: Props) {
  const { answer } = problem;
  const [expanded, setExpanded] = useState(() => !isCorrect);

  // バンク問題の保存済み answer には符内訳が無いため、無ければエンジンで再計算する
  // （scoreHand は決定的なので保存済みの解釈・符と一致する）。
  // 満貫以上（rank あり）は符が点数に影響しないため符内訳は表示しない。
  const fuDetail = answer.rank
    ? undefined
    : (answer.fuDetail ?? scoreHand(problemToScoreHandInput(problem))?.fuDetail);

  return (
    <>
      <section
        data-testid="result-breakdown"
        className="flex flex-col gap-3 p-[18px] bg-fl-card border-2 border-[rgba(43,168,162,0.3)] rounded-[var(--fl-r-lg)] shadow-[var(--fl-glow-teal-soft)] animate-[qp-rise_460ms_var(--fl-bounce)_both] motion-reduce:animate-none"
        aria-label="点数計算"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p
            className={`m-0 flex items-baseline gap-2 text-[length:var(--fs-emphasis)] font-semibold ${
              isCorrect ? "text-success" : "text-danger"
            }`}
          >
            <span>{isCorrect ? "○ 正解" : "✕ 不正解"}</span>
            <span className="font-numeric tabular-nums font-bold">
              答え: {formatPayment(answer.payment)}
            </span>
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1 self-start bg-transparent p-0 py-1 text-sm font-semibold text-fl-teal-dark border-0 cursor-pointer"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          解説はこちら
          <span aria-hidden="true">{expanded ? "▲" : "▼"}</span>
        </button>

        {expanded && (
          <div data-testid="result-breakdown-body" className="flex flex-col gap-3">
            {fuDetail && <FuBreakdownContent detail={fuDetail} />}

            <ul className="list-none m-0 p-0 flex flex-col gap-0">
              {answer.yaku.map((y, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between text-[length:var(--fs-emphasis)] py-[9px] border-b-2 border-[rgba(43,168,162,0.22)] [border-bottom-style:dashed] last:border-b-0"
                >
                  <span className="text-fl-ink font-bold">{y.name}</span>
                  <span className="inline-flex items-center px-3 py-0.5 text-[0.85em] font-extrabold text-fl-teal-dark bg-fl-teal-bg rounded-[var(--fl-r-pill)]">
                    {y.han}翻
                  </span>
                </li>
              ))}
            </ul>
            <p className="m-0 pt-3 border-t-2 border-[rgba(43,168,162,0.4)] text-[length:var(--fs-emphasis)] font-extrabold font-numeric tabular-nums text-right text-fl-teal-dark">
              {formatCalculationLine(answer, problem.conditions.isDealer, problem.hand.winType)}
            </p>
          </div>
        )}
      </section>

      {expanded && answer.interpretationNote && (
        <section
          className="p-[16px_18px] bg-[color-mix(in_srgb,var(--color-fl-gold)_14%,#fff)] border-2 border-fl-gold-dark rounded-[var(--fl-r-lg)] shadow-[var(--fl-glow-gold-soft)]"
          aria-label="高点法の別解"
        >
          <h2 className="flex items-center gap-1.5 m-0 mb-1 font-extrabold text-fl-gold-ink">
            <span className="text-[1.1em] leading-none" aria-hidden="true">
              💡
            </span>
            高点法の別解
          </h2>
          <p className="m-0 text-sm text-fl-body">{answer.interpretationNote}</p>
        </section>
      )}
    </>
  );
}
