import { useState } from "react";
import { problemToScoreHandInput, type Problem } from "../data/problem";
import { scoreHand } from "../engine/scoreHand";
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
      <section className="card result-breakdown" aria-label="点数計算">
        <div className="result-breakdown-header">
          <p className={`result-breakdown-verdict ${isCorrect ? "correct" : "incorrect"}`}>
            <span>{isCorrect ? "○ 正解" : "✕ 不正解"}</span>
            <span className="result-breakdown-answer">答え: {formatPayment(answer.payment)}</span>
          </p>
        </div>

        {collapsible ? (
          <button
            type="button"
            className="rp-detail-toggle"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
          >
            解説はこちら
            <span aria-hidden="true">{expanded ? "▲" : "▼"}</span>
          </button>
        ) : null}

        {expanded ? (
          <div className="result-breakdown-body">
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
          </div>
        ) : null}
      </section>

      {expanded && answer.interpretationNote ? (
        <section className="result-alt" aria-label="高点法の別解">
          <h2>
            <span className="rp-alt-icon" aria-hidden="true">
              💡
            </span>
            高点法の別解
          </h2>
          <p>{answer.interpretationNote}</p>
        </section>
      ) : null}
    </>
  );
}
