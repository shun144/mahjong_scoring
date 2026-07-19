import { Link, useLocation } from "react-router-dom";
import type { Problem } from "../data/problem";
import type { Payment } from "../engine/score";
import { ResultContent } from "./ResultContent";
import "./result.css";
import "./resultFlip7.css";
import { SidebarPageHeader } from "./SidebarPageHeader";

interface ResultLocationState {
  problem: Problem;
  selected: Payment;
  isCorrect: boolean;
}

function isResultLocationState(state: unknown): state is ResultLocationState {
  return !!state && typeof state === "object" && "problem" in state && "selected" in state;
}

export function ResultPage() {
  const location = useLocation();
  const state = isResultLocationState(location.state) ? location.state : null;

  if (!state) {
    return (
      <main className="page-shell result-page">
        <h1>解説</h1>
        <p>
          問題データがありません。<Link to="/quiz">出題画面</Link>から回答してください。
        </p>
      </main>
    );
  }

  const { problem, isCorrect } = state;

  return (
    <main className="page-shell result-page">
      <SidebarPageHeader title="解説" currentMode="score" backTo="/quiz" problem={problem} />
      <ResultContent problem={problem} isCorrect={isCorrect} />

      {/* .result-actions は FuResultPage.tsx とクラス名を共有しているため既存CSSを維持する
          （gap指定のみに使用）。中の2ボタンはこの画面専用のためTailwindユーティリティに
          置換している（T-014／SPEC.md §8.3.1）。 */}
      <div className="result-actions">
        <Link
          to="/quiz"
          state={{ problem, review: true }}
          className="flex-1 inline-flex items-center justify-center min-h-[54px] py-3 px-6 text-base font-bold text-fl-teal-dark bg-fl-cream border-2 border-fl-teal rounded-[var(--fl-r-pill)] no-underline cursor-pointer transition-[transform,background,color,box-shadow] duration-[220ms] ease-[var(--fl-bounce)] hover:text-fl-cream hover:bg-fl-teal hover:border-fl-teal hover:shadow-[var(--fl-glow-teal)] hover:-translate-y-0.5 active:scale-[0.96]"
        >
          問題に戻る
        </Link>
        <Link
          to="/quiz"
          className="flex-1 relative overflow-hidden inline-flex items-center justify-center gap-2 min-h-[54px] py-3 px-6 text-base font-extrabold text-fl-ink bg-[linear-gradient(180deg,var(--color-fl-gold-light)_0%,var(--color-fl-gold)_100%)] border-none rounded-[var(--fl-r-pill)] shadow-[var(--fl-glow-gold)] no-underline cursor-pointer transition-[transform,box-shadow] duration-[220ms] ease-[var(--fl-bounce)] before:content-[''] before:absolute before:inset-0 before:bottom-[52%] before:bg-[linear-gradient(180deg,rgba(255,255,255,0.55),rgba(255,255,255,0))] before:rounded-t-[var(--fl-r-pill)] before:rounded-b-[40%] before:pointer-events-none hover:shadow-[0_12px_28px_rgba(255,210,63,0.5)] hover:-translate-y-0.5 active:scale-[0.96]"
        >
          次の問題へ
          <span className="relative text-[1.1em] leading-none" aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </main>
  );
}
