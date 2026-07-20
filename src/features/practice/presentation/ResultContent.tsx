import { useState } from "react";
import { problemToScoreHandInput, type Problem } from "../domain/problem";
import { scoreHand } from "@/engine/scoreHand";
import { FuBreakdownContent } from "./FuBreakdown";
import { formatCalculationLine, formatPayment } from "./format";
import "./result.css";
import "./resultFlip7.css";

interface Props {
  problem: Problem;
  isCorrect: boolean;
  /**
   * true の場合、内訳〜高点法別解（「解説」）を「解説はこちら」トグルで開閉可能にする。
   * 初期状態は正解時=畳む／不正解時=展開。既定 false（ResultPage 用。常に展開表示）。
   */
  collapsible?: boolean;
}

/**
 * 正誤・答え・内訳（役・符・計算式）・高点法別解の表示部分。
 * ResultPage（解説画面）と QuizPage（インライン結果）の両方から共有される。
 */
export function ResultContent({ problem, isCorrect, collapsible = false }: Props) {
  const { answer } = problem;
  // 正解時はテンポ優先で畳む／不正解時は学習のため自動展開する（非懲罰: 見た目で咎めない）。
  const [expanded, setExpanded] = useState(() => !collapsible || !isCorrect);

  // バンク問題の保存済み answer には符内訳が無いため、無ければエンジンで再計算する
  // （scoreHand は決定的なので保存済みの解釈・符と一致する）。
  // 満貫以上（rank あり）は符が点数に影響しないため符内訳は表示しない。
  const fuDetail = answer.rank
    ? undefined
    : (answer.fuDetail ?? scoreHand(problemToScoreHandInput(problem))?.fuDetail);

  return (
    <>
      {/* .card / .result-breakdown（基底）は FuResultPage.tsx・FuPartsQuizPage.tsx とクラス名を
          共有しているため既存CSSを維持する。ここから下（見出し行・トグル・役一覧・計算式）は
          この画面専用のためTailwindユーティリティに置換している（T-014／SPEC.md §8.3.1）。 */}
      <section className="card result-breakdown" aria-label="点数計算">
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

        {collapsible ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 self-start bg-transparent p-0 py-1 text-sm font-semibold text-fl-teal-dark border-0 cursor-pointer"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
          >
            解説はこちら
            <span aria-hidden="true">{expanded ? "▲" : "▼"}</span>
          </button>
        ) : null}

        {expanded ? (
          <div data-testid="result-breakdown-body" className="flex flex-col gap-3">
            {fuDetail ? <FuBreakdownContent detail={fuDetail} /> : null}
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
        ) : null}
      </section>

      {expanded && answer.interpretationNote ? (
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
      ) : null}
    </>
  );
}
