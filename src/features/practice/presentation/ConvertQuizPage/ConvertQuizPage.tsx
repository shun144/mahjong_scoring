import { useState } from "react";
import type { Payment } from "../../../../engine/score";
import { nextConversionQuestion, type ConversionQuestion } from "../../application/conversion";
import { paymentKey } from "../../application/distractors";
import { useSettings } from "../../../settings/presentation/SettingsContext";
import { ChoiceGrid } from "../../../../shared/components/ChoiceGrid";
import "./convert.css";
import {
  conversionFormulaParts,
  formatConversionFormula,
  formatPayment,
  WIN_TYPE_LABELS,
} from "../format";
import "../quiz.css";
import "../result.css";
import { ScoreTableDialog } from "../../../../shared/components/ScoreTableDialog";
import { SidebarPageHeader } from "../../../../shared/components/SidebarPageHeader";

interface ConvertRound {
  question: ConversionQuestion;
  choices: Payment[];
  selected: Payment | null;
}

function newRound(roundUpMangan: boolean): ConvertRound {
  const { question, choices } = nextConversionQuestion(Math.random, roundUpMangan);
  return { question, choices, selected: null };
}

/**
 * 点数換算モード（SPEC.md §4.9）。手牌を出さず、符・翻・親子・ツモ/ロンの条件のみを提示し、
 * 対応する最終点数を4択で答える。回答結果は出題カード（フラッシュカード）の中に表示し、
 * カードは結果ゾーンの領域を回答前から確保しておくことで、選択肢・「次の問題へ」ボタンの
 * 位置が回答前後で変わらない。成績には連携しない（§4.5 の集計対象外）。
 */
export function ConvertQuizPage() {
  const { settings } = useSettings();
  const [round, setRound] = useState<ConvertRound>(() => newRound(settings.roundUpMangan));
  // 点数早見表ダイアログの開閉。
  const [showScoreTable, setShowScoreTable] = useState(false);

  function handleAnswer(selected: Payment) {
    setRound((prev) => ({ ...prev, selected }));
  }

  function handleNext() {
    setRound(newRound(settings.roundUpMangan));
  }

  const { question, choices, selected } = round;
  const isCorrect = selected ? paymentKey(selected) === paymentKey(question.answer) : null;
  const dealerLabel = question.isDealer ? "親" : "子";

  return (
    <main className="page-shell quiz-page convert-page">
      <SidebarPageHeader
        title="点数換算"
        currentMode="convert"
        showStats={false}
        headerAction={
          <button
            type="button"
            className="qp-table-header-btn"
            onClick={() => setShowScoreTable(true)}
            aria-label="点数早見表を開く"
          >
            <span aria-hidden="true">📋</span>
          </button>
        }
      />

      <section className="quiz-conditions convert-question" aria-label="条件">
        {settings.roundUpMangan ? (
          <span className="badge badge--roundup">
            <span className="badge-value">満貫切上</span>
          </span>
        ) : null}
        <span className="badge badge--dealer">
          <span className="badge-value">{dealerLabel}</span>
        </span>
        <span className="badge badge--convert-wintype">
          <span className="badge-value">{WIN_TYPE_LABELS[question.winType]}</span>
        </span>
      </section>

      <section className="convert-flashcard" aria-label="お題">
        <p className="convert-flashcard-value">
          {question.fu}符{question.han}翻
        </p>
        {/*
          結果は出題カードの中（符・翻の下）に表示する。回答前も答え・計算式は
          DOM上に描画したまま visibility:hidden で隠し、領域だけを確保しておく
          （selected の有無でノードの着脱をしない）ことで、カードの高さが
          回答前後で変わらず、下に続く選択肢・「次の問題へ」ボタンの位置が動かない。
        */}
        <div
          className={`convert-flashcard-result${selected ? " convert-flashcard-result--revealed" : ""}`}
          aria-hidden={!selected}
          aria-live="polite"
        >
          <div className="result-verdict-row">
            {/* 未回答時は「✕ 不正解」（2択のうち長い方）を非表示のまま描画し、
                回答後にどちらの文言が出ても幅がぶれないよう領域を確保する。 */}
            <p
              className={`result-verdict ${selected ? (isCorrect ? "correct" : "incorrect") : ""}`}
            >
              {!selected || !isCorrect ? "✕ 不正解" : "○ 正解"}
            </p>
            <p className="result-answer">答え: {formatPayment(question.answer)}</p>
          </div>
          <ConversionFormulaLine question={question} />
        </div>
      </section>

      <section className="quiz-answer">
        <p className="quiz-answer-label">
          <span className="qp-answer-icon" aria-hidden="true">
            🎯
          </span>
          点数を選んでください
        </p>
        <ChoiceGrid
          items={choices}
          keyOf={paymentKey}
          renderLabel={formatPayment}
          onSelect={handleAnswer}
        />
      </section>

      <section className="quiz-skip">
        <button type="button" className="qp-skip-btn" onClick={handleNext}>
          次の問題へ
          <span className="qp-skip-arrow" aria-hidden="true">
            ↻
          </span>
        </button>
      </section>

      <ScoreTableDialog open={showScoreTable} onClose={() => setShowScoreTable(false)} />
    </main>
  );
}

/**
 * 計算式を1行で表示する（SPEC.md §4.9）。指数 `(2+N翻)` は累乗と分かるよう
 * `<sup>` で上付きにする。可視部は aria-hidden にし、平文（`formatConversionFormula`）を
 * 親 <p> の aria-label で読み上げる。
 */
function ConversionFormulaLine({ question }: { question: ConversionQuestion }) {
  const { fu, han, multiplierLabel, product, rounded, paymentText } =
    conversionFormulaParts(question);

  return (
    <p className="calculation-line convert-formula" aria-label={formatConversionFormula(question)}>
      <span aria-hidden="true">
        {fu}符 × 2<sup>(2+{han}翻)</sup> {multiplierLabel} ={" "}
        {rounded ? `${product} → ${paymentText}` : paymentText}
      </span>
    </p>
  );
}
