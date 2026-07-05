import { Link, useLocation } from "react-router-dom";
import { problemToScoreHandInput, type Problem } from "../data/problem";
import { scoreHand } from "../engine/scoreHand";
import { FuBreakdownContent } from "./FuBreakdown";
import "./result.css";
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
      <main className="page-shell">
        <h1>解説</h1>
        <p>
          問題データがありません。<Link to="/fu/quiz">符計算の出題画面</Link>から回答してください。
        </p>
      </main>
    );
  }

  const { problem, selected, isCorrect } = state;
  const { answer } = problem;

  // バンク問題の保存済み answer には符内訳が無いため、無ければエンジンで再計算する（決定的）。
  const fuDetail = answer.fuDetail ?? scoreHand(problemToScoreHandInput(problem))?.fuDetail;

  return (
    <main className="page-shell">
      <PageHeader title="解説" />
      <p className={`result-verdict ${isCorrect ? "correct" : "incorrect"}`}>
        {isCorrect ? "○ 正解" : "✕ 不正解"}
      </p>
      {!isCorrect ? <p className="result-your-answer">あなたの回答: {selected}符</p> : null}
      <p className="result-fu-answer">正解: {answer.fu}符</p>

      <section className="card result-breakdown" aria-label="符計算">
        {fuDetail ? <FuBreakdownContent detail={fuDetail} /> : null}
        <ul className="yaku-list">
          {answer.yaku.map((y, i) => (
            <li key={i}>
              <span>{y.name}</span>
              <span>{y.han}翻</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="result-actions">
        <Link to="/fu/quiz" state={{ problem, review: true }} className="btn-secondary">
          問題に戻る
        </Link>
        <Link to="/fu/quiz" className="btn-primary">
          次の問題へ
        </Link>
      </div>
    </main>
  );
}
