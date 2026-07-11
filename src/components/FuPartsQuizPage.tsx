import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { problemToScoreHandInput, type Problem } from "../data/problem";
import type { FuElementBreakdown } from "../engine/fu";
import { scoreHand } from "../engine/scoreHand";
import {
  FIXED_FU_CHOICES,
  generateMeldTotalChoices,
  PAIR_CHOICES,
  WAIT_CHOICES,
  WIN_METHOD_CHOICES,
} from "../generator/fuElementChoices";
import { createSeededRandom, seedFromString } from "../generator/random";
import { nextProblem } from "../store/nextProblem";
import { recordAnswer } from "../store/statsStore";
import { FuBreakdownContent } from "./FuBreakdown";
import "./quiz.css";
import "./quizFlip7.css";
import "./fuParts.css";
import { WIN_TYPE_LABELS } from "./format";
import { PageHeader } from "./PageHeader";
import { QuizConditions } from "./QuizConditions";
import { HandDisplay } from "./tiles/HandDisplay";
import { TileFace } from "./tiles/TileFace";

/** 解説（成績画面）から「問題に戻る」で渡される復習用の遷移 state。 */
function isReviewState(state: unknown): state is { problem: Problem; review: boolean } {
  return !!state && typeof state === "object" && "problem" in state && "review" in state;
}

/** 標準手（4面子1雀頭）で選ぶ4要素の回答状態。未選択は null。 */
interface StandardAnswers {
  winMethod: number | null;
  meldTotal: number | null;
  pair: number | null;
  wait: number | null;
}

function emptyStandardAnswers(): StandardAnswers {
  return { winMethod: null, meldTotal: null, pair: null, wait: null };
}

function isStandardComplete(a: StandardAnswers): boolean {
  return a.winMethod !== null && a.meldTotal !== null && a.pair !== null && a.wait !== null;
}

function isStandardFullyCorrect(
  a: StandardAnswers,
  fu: FuElementBreakdown & { kind: "standard" },
): boolean {
  return (
    a.winMethod === fu.winMethod &&
    a.meldTotal === fu.meldTotal &&
    a.pair === fu.pair &&
    a.wait === fu.wait
  );
}

/**
 * 符分解モード（SPEC.md §4.10）。符計算モードと同じ和了形（満貫以上・ドラは対象外）に対し、
 * 符を要素ごと（標準手=上がり方・面子の符合計・雀頭・待ち／固定符手=固定符）に選ばせ、
 * 一括採点する。出題〜回答〜採点を単一画面にインライン集約する（別 result 画面を持たない）。
 */
export function FuPartsQuizPage() {
  const location = useLocation();
  // 解説（成績画面）から「問題に戻る」で来た場合は同じ問題を再表示する。復習なので成績は記録しない。
  const [reviewProblem, setReviewProblem] = useState(() =>
    isReviewState(location.state) ? location.state.problem : null,
  );
  const [problem, setProblem] = useState(
    () => reviewProblem ?? nextProblem(Math.random, { excludeMangan: true }),
  );
  const [standardAnswers, setStandardAnswers] = useState<StandardAnswers>(emptyStandardAnswers);
  const [fixedAnswer, setFixedAnswer] = useState<number | null>(null);
  const [graded, setGraded] = useState(false);

  const fuElements = useMemo<FuElementBreakdown | undefined>(
    () => scoreHand(problemToScoreHandInput(problem), { includeFuElements: true })?.fuElements,
    [problem],
  );
  // 参考として下部に併記する符内訳（0符要素込み。符計算モードの解説と同じ表示）。
  const fuDetail = useMemo(
    () => scoreHand(problemToScoreHandInput(problem), { includeZeroFu: true })?.fuDetail,
    [problem],
  );

  const rng = useMemo(() => createSeededRandom(seedFromString(problem.id)), [problem]);
  const meldTotalChoices = useMemo(() => {
    if (!fuElements || fuElements.kind !== "standard") return [];
    return generateMeldTotalChoices(fuElements.meldTotal, rng);
  }, [fuElements, rng]);

  if (!fuElements) {
    // 満貫以上を除外した出題のみ渡す前提のため、通常は起こらない防御的な分岐。
    return (
      <main className="page-shell quiz-page fu-parts-page">
        <PageHeader title="符分解" backTo="/fu/parts" problem={problem} />
        <p>問題を読み込めませんでした。</p>
      </main>
    );
  }

  const isComplete =
    fuElements.kind === "fixed" ? fixedAnswer !== null : isStandardComplete(standardAnswers);
  const isFullyCorrect =
    fuElements.kind === "fixed"
      ? fixedAnswer === fuElements.fu
      : isStandardFullyCorrect(standardAnswers, fuElements);

  function handleGrade() {
    if (!isComplete) return;
    if (!reviewProblem) recordAnswer(problem, isFullyCorrect); // 復習（同じ問題の再回答）は二重計上しない
    setGraded(true);
  }

  function handleNext() {
    setReviewProblem(null);
    setProblem(nextProblem(Math.random, { excludeMangan: true }));
    setStandardAnswers(emptyStandardAnswers());
    setFixedAnswer(null);
    setGraded(false);
  }

  const winType = problem.hand.winType;

  return (
    <main className="page-shell quiz-page fu-parts-page">
      <PageHeader title="符分解" backTo="/fu/parts" problem={problem} />

      {/* お題（局条件・アガリ牌・手牌）を上部にまとめてsticky固定し、下の選択肢を
          操作している間も手牌が視界から外れないようにする（スマホ1画面表示。SPEC.md §4.10）。 */}
      <div className="fu-parts-sticky">
        <div className="fu-parts-conditions-row">
          <QuizConditions conditions={problem.conditions} showRiichi={false} />
          {/* アガリ牌は独立ブロックにせず、局条件バッジの隣にチップとして添える。 */}
          <span className={`badge fu-parts-wintype-badge fu-parts-wintype-badge--${winType}`}>
            <TileFace tile={problem.hand.winningTile} size="sm" />
            <span className="badge-value">{WIN_TYPE_LABELS[winType]}</span>
          </span>
        </div>

        <section className="fu-parts-board" aria-label="手牌">
          <HandDisplay
            concealed={problem.hand.concealed}
            melds={problem.hand.melds}
            winningTile={problem.hand.winningTile}
          />
        </section>
      </div>

      <section className="fu-parts-form" aria-label="符の要素">
        {fuElements.kind === "standard" ? (
          <>
            <p className="fu-parts-base">副底(基本) 20符（固定）</p>
            <ElementRow
              label="上がり方"
              choices={WIN_METHOD_CHOICES}
              selected={standardAnswers.winMethod}
              correct={fuElements.winMethod}
              graded={graded}
              onSelect={(value) => setStandardAnswers((a) => ({ ...a, winMethod: value }))}
              full
            />
            <ElementRow
              label="面子(合計)"
              choices={meldTotalChoices}
              selected={standardAnswers.meldTotal}
              correct={fuElements.meldTotal}
              graded={graded}
              onSelect={(value) => setStandardAnswers((a) => ({ ...a, meldTotal: value }))}
              full
            />
            <div className="fu-parts-row-pair">
              <ElementRow
                label="雀頭"
                choices={PAIR_CHOICES}
                selected={standardAnswers.pair}
                correct={fuElements.pair}
                graded={graded}
                onSelect={(value) => setStandardAnswers((a) => ({ ...a, pair: value }))}
              />
              <ElementRow
                label="待ち"
                choices={WAIT_CHOICES}
                selected={standardAnswers.wait}
                correct={fuElements.wait}
                graded={graded}
                onSelect={(value) => setStandardAnswers((a) => ({ ...a, wait: value }))}
              />
            </div>
          </>
        ) : (
          <ElementRow
            label="固定符"
            choices={FIXED_FU_CHOICES}
            selected={fixedAnswer}
            correct={fuElements.fu}
            graded={graded}
            onSelect={setFixedAnswer}
          />
        )}

        <div
          className={`fu-parts-summary${graded ? " fu-parts-summary--revealed" : ""}`}
          aria-hidden={!graded}
          aria-live="polite"
        >
          {fuElements.kind === "standard" ? (
            <p className="fu-parts-summary-line">
              20 + {fuElements.winMethod} + {fuElements.meldTotal} + {fuElements.pair} +{" "}
              {fuElements.wait} = {fuElements.subtotal}符 → 切り上げ {fuElements.total}符
            </p>
          ) : (
            <p className="fu-parts-summary-line">{fuElements.fu}符（固定）</p>
          )}
          {fuElements.kind === "standard" && fuElements.note ? (
            <p className="fu-note">{fuElements.note}</p>
          ) : null}
          <p className={`result-verdict ${isFullyCorrect ? "correct" : "incorrect"}`}>
            {isFullyCorrect ? "○ 完答" : "✕ 一部不正解"}
          </p>
        </div>

        <button
          type="button"
          className="fu-parts-grade-btn"
          disabled={!isComplete || graded}
          onClick={handleGrade}
        >
          採点する
        </button>
      </section>

      <section className="quiz-skip">
        <button type="button" className="qp-skip-btn" onClick={handleNext}>
          次の問題へ
          <span className="qp-skip-arrow" aria-hidden="true">
            ↻
          </span>
        </button>
      </section>

      {graded && fuDetail ? (
        <details className="fu-parts-detail">
          <summary className="fu-parts-detail-summary">符の内訳を見る</summary>
          <div className="card result-breakdown result-breakdown--primary fu-parts-detail-body">
            <FuBreakdownContent detail={fuDetail} />
          </div>
        </details>
      ) : null}
    </main>
  );
}

/** 符の要素1行分。項目名の上の正誤マーク（採点後の○/✕）＋ラベル＋選択肢ボタン。 */
function ElementRow({
  label,
  choices,
  selected,
  correct,
  graded,
  onSelect,
  full,
}: {
  label: string;
  choices: readonly number[];
  selected: number | null;
  correct: number;
  graded: boolean;
  onSelect: (value: number) => void;
  /** 全幅表示の行（上がり方・面子(合計)）か。true の場合、ラベル列幅を grid で揃える対象になる。 */
  full?: boolean;
}) {
  const isCorrect = selected === correct;
  const verdictClass = graded
    ? isCorrect
      ? " fu-parts-row-verdict--correct"
      : " fu-parts-row-verdict--incorrect"
    : "";
  return (
    <div className="fu-parts-row" role="group" aria-label={label}>
      {/* 正誤マークは項目名の真上に置く（○/✕のみ）。正解の値は選択肢ボタンの配色で判別できる。 */}
      <span className={`fu-parts-row-verdict${verdictClass}`} aria-hidden={!graded}>
        {graded ? (isCorrect ? "○" : "✕") : " "}
      </span>
      <div className={`fu-parts-row-main${full ? " fu-parts-row-main--full" : ""}`}>
        <span className="fu-parts-row-label">{label}</span>
        <div className="fu-parts-row-choices">
          {choices.map((value) => {
            const isSelected = selected === value;
            let stateClass = "";
            if (!graded) {
              stateClass = isSelected ? "fu-parts-choice-btn--selected" : "";
            } else if (isSelected) {
              stateClass = isCorrect
                ? "fu-parts-choice-btn--correct"
                : "fu-parts-choice-btn--incorrect";
            } else if (value === correct) {
              stateClass = "fu-parts-choice-btn--reveal";
            }
            return (
              <button
                key={value}
                type="button"
                className={`fu-parts-choice-btn${stateClass ? ` ${stateClass}` : ""}`}
                disabled={graded}
                onClick={() => onSelect(value)}
              >
                {value}符
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
