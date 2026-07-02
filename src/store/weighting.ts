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
