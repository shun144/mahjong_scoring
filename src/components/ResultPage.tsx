import { Link, useLocation } from "react-router-dom";
import { problemToScoreHandInput, type Problem } from "../data/problem";
import type { Payment } from "../engine/score";
import { scoreHand } from "../engine/scoreHand";
import { FuBreakdownContent } from "./FuBreakdown";
import { formatCalculationLine, formatPayment } from "./format";
import "./result.css";

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
      <main className="page-shell">
        <h1>解説</h1>
        <p>
          問題データがありません。<Link to="/quiz">出題画面</Link>から回答してください。
        </p>
      </main>
    );
  }

  const { problem, selected, isCorrect } = state;
  const { answer } = problem;

  // バンク問題の保存済み answer には符内訳が無いため、無ければエンジンで再計算する
  // （scoreHand は決定的なので保存済みの解釈・符と一致する）。
  // 満貫以上（rank あり）は符が点数に影響しないため符内訳は表示しない。
  const fuDetail = answer.rank
    ? undefined
    : (answer.fuDetail ?? scoreHand(problemToScoreHandInput(problem))?.fuDetail);

  return (
    <main className="page-shell">
      <div className="page-header">
        <h1>解説</h1>
        <Link to="/stats" className="page-header-link">
          成績を見る
        </Link>
      </div>
      <p className={`result-verdict ${isCorrect ? "correct" : "incorrect"}`}>
        {isCorrect ? "○ 正解" : "✕ 不正解"}
      </p>
      {!isCorrect ? (
        <p className="result-your-answer">あなたの回答: {formatPayment(selected)}</p>
      ) : null}
      <p className="result-answer">正解: {formatPayment(answer.payment)}</p>

      <section className="card result-breakdown" aria-label="点数計算">
        {fuDetail ? <FuBreakdownContent detail={fuDetail} /> : null}
        <ul className="yaku-list">
          {answer.yaku.map((y, i) => (
            <li key={i}>
              <span>{y.name}</span>
              <span>{y.han}翻</span>
            </li>
          ))}
        </ul>
        <p className="calculation-line">
          {formatCalculationLine(answer, problem.conditions.isDealer, problem.hand.winType)}
        </p>
      </section>

      {answer.interpretationNote ? (
        <section className="result-alt" aria-label="高点法の別解">
          <h2>高点法の別解</h2>
          <p>{answer.interpretationNote}</p>
        </section>
      ) : null}

      <div className="result-actions">
        <Link to="/quiz" state={{ problem, review: true }} className="btn-secondary">
          問題に戻る
        </Link>
        <Link to="/quiz" className="btn-primary">
          次の問題へ
        </Link>
      </div>
    </main>
  );
}
