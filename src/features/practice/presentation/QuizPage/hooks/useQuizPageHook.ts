import type { Payment } from "@/core/scoring/domain/condition/types";
import { generateChoices, paymentKey } from "@/features/practice/application/distractors";
import { nextProblem } from "@/features/practice/application/nextProblem";
import { createSeededRandom, seedFromString } from "@/features/practice/application/random";
import { loadStats, recordAnswer } from "@/features/practice/application/statsStore";
import { resolveAnswer, type Problem } from "@/features/practice/domain/problem";
import { useSettings } from "@/features/settings/presentation/SettingsContext";
import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

/** 解説画面から「問題に戻る」で渡される復習用の遷移state */
function isReviewState(state: unknown): state is { problem: Problem; review: boolean } {
  return !!state && typeof state === "object" && "problem" in state && "review" in state;
}

interface Answered {
  selected: Payment;
  isCorrect: boolean;
}

export function useQuizPageHook() {
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

  // 点数早見表ダイアログの開閉
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
    if (answered) return;
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

  return {
    problem,
    setShowScoreTable,
    stats,
    effectiveProblem,
    settings,
    answered,
    handleRetry,
    handleNext,
    choices,
    handleAnswer,
    showScoreTable,
  };
}
