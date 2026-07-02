import { Link, useLocation } from "react-router-dom";
import type { Problem } from "../data/problem";
import { doraFromIndicator } from "../engine/dora";
import type { Payment } from "../engine/score";
import type { Tile } from "../engine/model";
import { formatCalculationLine, formatPayment } from "./format";
import { TileFace } from "./tiles/TileFace";
import "./result.css";

interface ResultLocationState {
  problem: Problem;
  selected: Payment;
  isCorrect: boolean;
}

function isResultLocationState(state: unknown): state is ResultLocationState {
  return !!state && typeof state === "object" && "problem" in state && "selected" in state;
}

function DoraRevealRow({ label, indicators }: { label: string; indicators: readonly Tile[] }) {
  if (indicators.length === 0) {
    return (
      <div className="dora-reveal-row">
        <span>{label}: なし</span>
      </div>
    );
  }
  return (
    <div className="dora-reveal-row">
      <span>{label}:</span>
      {indicators.map((indicator, i) => (
        <span className="dora-reveal-pair" key={i}>
          <TileFace tile={indicator} size="sm" />
          <span aria-hidden="true">→</span>
          <TileFace tile={doraFromIndicator(indicator)} size="sm" />
        </span>
      ))}
    </div>
  );
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

      <section className="card result-breakdown" aria-label="内訳">
        <h2>成立役</h2>
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

      <section className="dora-reveal" aria-label="ドラの読み替え">
        <DoraRevealRow label="ドラ表示牌 → ドラ" indicators={problem.doraIndicators} />
        {problem.conditions.riichi ? (
          <DoraRevealRow label="裏ドラ表示牌 → 裏ドラ" indicators={problem.uraDoraIndicators} />
        ) : null}
      </section>

      {answer.interpretationNote ? (
        <section className="result-alt" aria-label="高点法の別解">
          <h2>高点法の別解</h2>
          <p>{answer.interpretationNote}</p>
        </section>
      ) : null}

      <Link to="/quiz" className="btn-primary">
        次の問題へ
      </Link>
    </main>
  );
}
