import { Link, useLocation } from "react-router-dom";
import { problemToScoreHandInput, type Problem } from "../data/problem";
import { scoreHand } from "../engine/scoreHand";
import { FuBreakdownContent } from "./FuBreakdown";
import "./result.css";
import "./resultFlip7.css";
import { PageHeader } from "./PageHeader";

interface FuResultLocationState {
  problem: Problem;
  selected: number;
  isCorrect: boolean;
}

function isFuResultLocationState(state: unknown): state is FuResultLocationState {
  return !!state && typeof state === "object" && "problem" in state && "selected" in state;
}

export function FuResultPage() {
  const location = useLocation();
  const state = isFuResultLocationState(location.state) ? location.state : null;

  if (!state) {
    return (
      <main className="page-shell result-page">
        <h1>解説</h1>
        <p>
          問題データがありません。<Link to="/fu/quiz">符計算の出題画面</Link>から回答してください。
        </p>
      </main>
    );
  }

  const { problem, isCorrect } = state;
  const { answer } = problem;

  // 符計算モードの解説では0符要素も含めた全内訳を見せる。保存済み answer.fuDetail には
  // 0符要素が無いため、常にエンジンで再計算する（scoreHand は決定的で保存値と一致する）。
  const fuDetail =
    scoreHand(problemToScoreHandInput(problem), { includeZeroFu: true })?.fuDetail ??
    answer.fuDetail;

  return (
    <main className="page-shell result-page">
      <PageHeader title="解説" />
      <div className="result-verdict-row">
        <p className={`result-verdict ${isCorrect ? "correct" : "incorrect"}`}>
          {isCorrect ? "○ 正解" : "✕ 不正解"}
        </p>
        <p className="result-answer">答え: {answer.fu}符</p>
      </div>

      <section className="card result-breakdown result-breakdown--primary" aria-label="符計算">
        <span className="rp-section-label">符の内訳</span>
        {fuDetail ? <FuBreakdownContent detail={fuDetail} /> : null}
      </section>

      <div className="result-actions">
        <Link to="/fu/quiz" state={{ problem, review: true }} className="btn-secondary">
          問題に戻る
        </Link>
        <Link to="/fu/quiz" className="btn-primary">
          次の問題へ
          <span className="rp-cta-arrow" aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </main>
  );
}
