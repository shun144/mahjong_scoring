import type { Problem } from "../data/problem";
import type { RandomSource } from "../generator/random";
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

/** 出題傾向を調整するカテゴリ別バイアス（苦手復習の重みに掛ける）。 */
const YAKUMAN_BIAS = 0.18; // 役満は出過ぎるため抑える（実出題で約3%）
const CHIITOI_BIAS = 0.31; // 七対子は出過ぎるため抑える（実出題で約6%）
const MANGAN_FU50_BIAS = 2.2; // 満貫以上かつ50符以上の高符高翻手は薄いため増やす

/**
 * カテゴリ別の出題頻度バイアス（問題の内容だけで決まり、成績に依らない）。
 * 苦手復習の重み（problemWeight）に乗算して最終的な出題傾向を整える。
 * 役満・七対子は体感で出過ぎるため抑制し、満貫以上×50符以上の高符高翻手は薄いため増やす。
 * 区分は排他（役満→七対子→満貫以上&50符+ の順に判定）。
 */
export function categoryBias(problem: Problem): number {
  const { rank, fu, yaku } = problem.answer;
  if (rank === "yakuman") return YAKUMAN_BIAS;
  if (yaku.some((y) => y.name.includes("七対子"))) return CHIITOI_BIAS;
  if (rank !== undefined && fu >= 50) return MANGAN_FU50_BIAS;
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
