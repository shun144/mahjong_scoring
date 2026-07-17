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

      <div className="result-actions">
        <Link to="/quiz" state={{ problem, review: true }} className="btn-secondary">
          問題に戻る
        </Link>
        <Link to="/quiz" className="btn-primary">
          次の問題へ
          <span className="rp-cta-arrow" aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </main>
  );
}
