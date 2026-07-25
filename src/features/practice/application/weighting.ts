import type { Problem } from "../domain/problem";
import type { RandomSource } from "./random";
import type { StatsState, TagStat } from "./statsStore";

/** 未挑戦タグの起点となる正答率（1/2 = 中立）。新規タグを不当に得意/苦手扱いしない。 */
const PRIOR_CORRECT = 1;
const PRIOR_TOTAL = 2;
/** 得意タグ(正答率100%)でも露出が0にならないための下駄。 */
const WEIGHT_BASE = 1.2;

function tagAccuracy(stat: TagStat | undefined): number {
  const correct = (stat?.correct ?? 0) + PRIOR_CORRECT;
  const total = (stat?.total ?? 0) + PRIOR_TOTAL;
  return correct / total;
}

/**
 * 問題の出題重みを算出する。符の型・役の種類のうち最も正答率が低いタグを基準に、
 * 苦手なタグを含む問題ほど大きな重みを持たせる（SPEC.md §4.5 苦手復習）。
 */
export function problemWeight(problem: Problem, stats: StatsState): number {
  const accuracies = [
    tagAccuracy(stats.byFuType[String(problem.tags.fuType)]),
    ...problem.tags.yakuCategories.map((category) => tagAccuracy(stats.byYakuCategory[category])),
  ];
  const minAccuracy = Math.min(...accuracies);
  return WEIGHT_BASE - minAccuracy;
}

/** 出題傾向を調整するカテゴリ別バイアス（苦手復習の重みに掛ける）。
    以下の数値は nextProblem.ts の GENERATED_CANDIDATE_COUNT（生成候補数）に依存する。
    候補数を変えると同じ数値でも効き方が変わるため、候補数を変更する場合はこの4つの
    バイアス値すべてを scripts/measureDistribution.ts で再実測・再調整すること（T-028）。 */
const YAKUMAN_BIAS = 0.4; // 役満は出過ぎるため抑える（実出題で約3%）
const CHIITOI_BIAS = 0.13; // 七対子は出過ぎるため抑える（実出題で約6%）
/** 満貫以上（役満を除く）を一括抑制する一般係数。素の生成分布は満貫以上が約50%を占め、
    最終点数モードの出題体感を歪めていたため、最終点数モードでの出現率が約15%
    （許容12〜18%）に収まるよう実測調整した（/grill-plan T-028。SPEC.md §4.1）。 */
const MANGAN_BIAS = 0.08;
/** 満貫以上かつ50符以上の高符高翻手は薄いため、MANGAN_BIAS のさらに上に乗算して増やす
    （排他ではなく重ねがけ。T-028で2.2から実測調整）。 */
const MANGAN_FU50_BIAS = 1.6;
/** 符計算モード専用の七対子抑制係数。excludeMangan（満貫以上を出題しない）により
    満貫以上の候補が丸ごと除外される分、七対子の相対比率が最終点数モードより上がるため、
    既定の CHIITOI_BIAS とは別に、excludeMangan 環境下で実出題約8〜9%になるよう
    実測調整した値を持つ（T-028。旧デフォルトCHIITOI_BIASを流用していたことに由来する水準）。 */
export const CHIITOI_BIAS_FU_QUIZ = 0.45;
/** 符分解モード専用の七対子抑制係数。七対子は固定符（25符を選ぶだけ）で要素分解の
    練習にならず、かつ excludeMangan により相対比率が上がるため、
    CHIITOI_BIAS_FU_QUIZ よりさらに強く抑え、実出題で約3%を狙う（実測調整値。SPEC.md §4.10）。 */
export const CHIITOI_BIAS_FU_PARTS = 0.12;

/**
 * カテゴリ別の出題頻度バイアス（問題の内容だけで決まり、成績に依らない）。
 * 苦手復習の重み（problemWeight）に乗算して最終的な出題傾向を整える。
 * 役満・七対子は体感で出過ぎるため抑制する（役満→七対子の順に排他判定。該当した方の
 * 係数のみを適用し、他の係数とは掛け合わせない）。
 * どちらにも該当しない満貫以上（役満を除く）は MANGAN_BIAS で一括抑制し、そのうち
 * 50符以上の高符高翻手はさらに MANGAN_FU50_BIAS を乗算して薄くなりすぎないようにする
 * （こちらは排他ではなく重ねがけ）。
 * chiitoiBias を渡すと七対子の抑制係数だけをモード別に上書きできる（既定は CHIITOI_BIAS）。
 */
export function categoryBias(problem: Problem, chiitoiBias: number = CHIITOI_BIAS): number {
  const { rank, fu, yaku } = problem.answer;
  if (rank === "yakuman") return YAKUMAN_BIAS;
  if (yaku.some((y) => y.name.includes("七対子"))) return chiitoiBias;
  if (rank !== undefined) {
    return fu >= 50 ? MANGAN_BIAS * MANGAN_FU50_BIAS : MANGAN_BIAS;
  }
  return 1;
}

/** 重み付きランダム選択。重みの合計が0以下の場合は先頭を返す。 */
export function weightedPick<T>(
  items: readonly T[],
  weights: readonly number[],
  rng: RandomSource,
): T {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return items[0];
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}
