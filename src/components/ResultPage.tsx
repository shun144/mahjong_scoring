import { Link, useLocation } from "react-router-dom";
import { problemToScoreHandInput, type Problem } from "../data/problem";
import { doraFromIndicator } from "../engine/dora";
import type { FuBreakdown, Payment } from "../engine/score";
import { scoreHand } from "../engine/scoreHand";
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

function DoraRow({ label, indicators }: { label: string; indicators: readonly Tile[] }) {
  return (
    <div className="dora-reveal-row">
      <span>{label}:</span>
      {indicators.length === 0 ? (
        <span>なし</span>
      ) : (
        indicators.map((indicator, i) => (
          <TileFace key={i} tile={doraFromIndicator(indicator)} size="sm" />
        ))
      )}
    </div>
  );
}

function formatFuItem(fu: number, isBase: boolean): string {
  // 先頭の基本値（副底・固定符）は素の値、それ以外は加符として「+」を付ける。
  return isBase ? `${fu}符` : `+${fu}符`;
}

function FuBreakdownSection({ detail }: { detail: FuBreakdown }) {
  return (
    <section className="card result-fu" aria-label="符の内訳">
      <h2>符の計算</h2>
      <ul className="fu-list">
        {detail.items.map((item, i) => (
          <li key={i}>
            <span>{item.count && item.count > 1 ? `${item.label} × ${item.count}` : item.label}</span>
            <span>{formatFuItem(item.fu, i === 0)}</span>
          </li>
        ))}
      </ul>
      {detail.fixed ? (
        <p className="fu-total">
          合計 <strong>{detail.total}符</strong>（固定）
        </p>
      ) : (
        <p className="fu-total">
          小計 {detail.subtotal}符 → 切り上げ <strong>{detail.total}符</strong>
        </p>
      )}
      {detail.note ? <p className="fu-note">{detail.note}</p> : null}
    </section>
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

      {fuDetail ? <FuBreakdownSection detail={fuDetail} /> : null}

      <section className="dora-reveal" aria-label="ドラ・裏ドラ">
        <DoraRow label="ドラ" indicators={problem.doraIndicators} />
        {problem.conditions.riichi ? (
          <DoraRow label="裏ドラ" indicators={problem.uraDoraIndicators} />
        ) : null}
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
