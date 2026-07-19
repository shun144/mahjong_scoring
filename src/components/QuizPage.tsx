import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { resolveAnswer, type Problem } from "../data/problem";
import type { Payment } from "../engine/score";
import { generateChoices, paymentKey } from "../generator/distractors";
import { createSeededRandom, seedFromString } from "../generator/random";
import { useSettings } from "../settings/SettingsContext";
import { nextProblem } from "../store/nextProblem";
import { getTodayAnswered, loadStats, recordAnswer } from "../store/statsStore";
import { ChoiceGrid } from "./ChoiceGrid";
import { formatPayment } from "./format";
import { ResultContent } from "./ResultContent";
import { SidebarPageHeader } from "./SidebarPageHeader";
import "./quiz.css";
import "./quizFlip7.css";
import { QuizConditions } from "./QuizConditions";
import { ScoreTableDialog } from "./ScoreTableDialog";
import { QuizTileHeader } from "./QuizTileHeader";
import { HandDisplay } from "./tiles/HandDisplay";

/** 解説画面から「問題に戻る」で渡される復習用の遷移 state。 */
function isReviewState(state: unknown): state is { problem: Problem; review: boolean } {
  return !!state && typeof state === "object" && "problem" in state && "review" in state;
}

interface Answered {
  selected: Payment;
  isCorrect: boolean;
}

// この画面専用の要素（.qp-table-header-btn以外）はTailwindユーティリティで実装する
// （T-014／SPEC.md §8.3.1）。.qp-skip-btn は quiz-skip 由来のクラスと同じ見た目を再現する
// クラス文字列を1箇所にまとめ、3箇所（もう一度／次の問題へ×2）で使い回す。
const SKIP_BTN_CLASS =
  "inline-flex items-center gap-2 min-h-[48px] px-6 text-[0.95rem] font-bold text-fl-teal-dark bg-fl-cream border-2 border-fl-teal rounded-[var(--fl-r-pill)] cursor-pointer transition-[transform,background,color,box-shadow] duration-[220ms] ease-[var(--fl-bounce)] hover:text-fl-cream hover:bg-fl-teal hover:shadow-[var(--fl-glow-teal)] hover:-translate-y-0.5 active:scale-[0.96] motion-reduce:transition-none motion-reduce:transform-none";
const SKIP_ARROW_CLASS = "text-[1.05em] leading-none";

export function QuizPage() {
  const location = useLocation();
  const { settings } = useSettings();
  // 解説から「問題に戻る」で来た場合は同じ問題を再表示する。復習なので成績は記録しない。
  const [reviewProblem, setReviewProblem] = useState(() =>
    isReviewState(location.state) ? location.state.problem : null,
  );
  const [problem, setProblem] = useState(() => reviewProblem ?? nextProblem());
  // 回答結果。null=未回答（選択肢を表示）、非nullなら同画面に結果をインライン表示する。
  const [answered, setAnswered] = useState<Answered | null>(null);
  // モメンタムカウンタ（今日の回答数・連続正解数）。出題中・結果時とも常時表示する。
  const [stats, setStats] = useState(() => loadStats());
  // 点数早見表ダイアログの開閉。
  const [showScoreTable, setShowScoreTable] = useState(false);
  // 切り上げ満貫設定を反映した実効問題。設定ロード完了前はfalse相当（標準ルール）で表示する。
  const effectiveProblem = useMemo(
    () => resolveAnswer(problem, settings.roundUpMangan),
    [problem, settings.roundUpMangan],
  );
  // 選択肢のシャッフルは問題IDから決定的に導出する。成績画面を経由して戻ってくるなど、
  // 同じ問題で画面が再マウントされても4択の内容・並び順が変わらないようにするため
  // （Math.randomだと再マウントのたびに再シャッフルされてしまう）。
  const choices = useMemo<Payment[]>(
    () =>
      generateChoices(
        effectiveProblem.answer.payment,
        {
          han: effectiveProblem.answer.han,
          fu: effectiveProblem.answer.fu,
          isDealer: effectiveProblem.conditions.isDealer,
          winType: effectiveProblem.hand.winType,
        },
        createSeededRandom(seedFromString(effectiveProblem.id)),
      ),
    [effectiveProblem],
  );
  function handleAnswer(selected: Payment) {
    if (answered) return; // 同一問題の結果表示中は再回答を計上しない
    const isCorrect = paymentKey(selected) === paymentKey(effectiveProblem.answer.payment);
    if (!reviewProblem) setStats(recordAnswer(problem, isCorrect)); // 復習（同じ問題の再回答）は二重計上しない
    setAnswered({ selected, isCorrect });
  }

  // 次の問題へ進む。未回答時は「次の問題へ」スキップ、回答後は結果からの「次へ」で使う。
  // いずれも成績には記録しない（記録は handleAnswer で1回のみ行う）。
  function handleNext() {
    setAnswered(null);
    setReviewProblem(null);
    setProblem(nextProblem());
  }

  // 回答後、同じ問題を回答・採点状態だけリセットして解き直す。「問題に戻る」と同じ復習扱いにし、
  // 再回答を成績に二重計上しない（handleAnswer の reviewProblem ガードを流用）。
  function handleRetry() {
    if (!answered) return;
    setReviewProblem(problem);
    setAnswered(null);
  }

  return (
    <main className="page-shell quiz-page">
      <SidebarPageHeader
        title="点数計算"
        currentMode="score"
        backTo="/quiz"
        problem={problem}
        headerAction={
          <button
            type="button"
            className="inline-flex items-center justify-center w-10 h-10 p-0 text-[1.2rem] leading-none border-0 rounded-full bg-transparent text-fl-teal-dark cursor-pointer shrink-0 transition-[background] duration-[220ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:bg-[rgba(43,168,162,0.14)]"
            onClick={() => setShowScoreTable(true)}
            aria-label="点数早見表を開く"
          >
            <span aria-hidden="true">📋</span>
          </button>
        }
      />
      <section className="flex items-baseline gap-[var(--space-5)]" aria-label="今回の記録">
        <div className="flex items-baseline gap-[var(--space-1)]">
          <strong
            data-testid="momentum-today"
            className="text-[length:var(--fs-score)] font-extrabold font-numeric tabular-nums text-text leading-none"
          >
            {getTodayAnswered(stats)}
          </strong>
          <span className="text-sm text-text-sub">今日の回答数</span>
        </div>
        <div className="flex items-baseline gap-[var(--space-1)]">
          <strong
            data-testid="momentum-streak"
            className="text-base font-bold font-numeric tabular-nums text-text-sub leading-none"
          >
            {stats.currentStreak}
          </strong>
          <span className="text-sm text-text-sub">連続正解</span>
        </div>
      </section>

      <section aria-label="問題" className="flex flex-col gap-1">
        <QuizConditions
          conditions={effectiveProblem.conditions}
          roundUpMangan={settings.roundUpMangan}
          showRiichi={false}
        />

        <section
          className="flex flex-col gap-[18px] px-4 py-[18px] bg-fl-teal-bg border-2 border-[rgba(43,168,162,0.2)] rounded-[var(--fl-r-lg)] shadow-[var(--fl-glow-teal-soft)] overflow-x-visible animate-[qp-rise_420ms_var(--fl-bounce)_both] motion-reduce:animate-none"
          aria-label="牌姿"
        >
          <QuizTileHeader problem={effectiveProblem} showRiichi />
          <div className="quiz-hand">
            <HandDisplay
              concealed={effectiveProblem.hand.concealed}
              melds={effectiveProblem.hand.melds}
              winningTile={effectiveProblem.hand.winningTile}
            />
          </div>
        </section>
      </section>

      {answered ? (
        <>
          <section className="flex justify-center gap-3">
            <button type="button" className={SKIP_BTN_CLASS} onClick={handleRetry}>
              もう一度
              <span className={SKIP_ARROW_CLASS} aria-hidden="true">
                ↻
              </span>
            </button>
            <button type="button" className={SKIP_BTN_CLASS} onClick={handleNext}>
              次の問題へ
              <span className={SKIP_ARROW_CLASS} aria-hidden="true">
                →
              </span>
            </button>
          </section>

          <section className="quiz-answer" aria-label="結果">
            <ResultContent problem={effectiveProblem} isCorrect={answered.isCorrect} collapsible />
          </section>
        </>
      ) : (
        <>
          <section className="quiz-answer">
            <ChoiceGrid
              items={choices}
              keyOf={paymentKey}
              renderLabel={formatPayment}
              onSelect={handleAnswer}
            />
          </section>

          <section className="flex justify-center gap-3">
            <button type="button" className={SKIP_BTN_CLASS} onClick={handleNext}>
              次の問題へ
              <span className={SKIP_ARROW_CLASS} aria-hidden="true">
                →
              </span>
            </button>
          </section>
        </>
      )}

      <ScoreTableDialog open={showScoreTable} onClose={() => setShowScoreTable(false)} />
    </main>
  );
}
