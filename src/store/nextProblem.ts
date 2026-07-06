import problemBankRaw from "../data/problemBank.json";
import type { Problem } from "../data/problem";
import { generateProblem } from "../generator/generateProblem";
import { chance, type RandomSource } from "../generator/random";
import { loadStats } from "./statsStore";
import { categoryBias, problemWeight, weightedPick } from "./weighting";

const problemBank = problemBankRaw as unknown as Problem[];
/** 生成問題は事前にタグが分からないため、複数候補を作ってから重み付けで選ぶ。 */
const GENERATED_CANDIDATE_COUNT = 3;

/** 符計算モードでは満貫以上（符が点数に影響しない区分）を出題しない（SPEC.md §4.0）。 */
export interface NextProblemOptions {
  excludeMangan?: boolean;
}

/** 出題対象として妥当か。excludeMangan 時は満貫以上（rank 付き）を除く。 */
function isEligible(problem: Problem, opts: NextProblemOptions): boolean {
  if (opts.excludeMangan && problem.answer.rank !== undefined) return false;
  return true;
}

/**
 * ランダムに次の出題を1つ選ぶ。バンクからのシャッフルとジェネレータ生成を半々で混ぜ
 * （SPEC.md §4.1）、成績（正答率の低いタグ）に基づいて苦手分野を重点的に出題する
 * （SPEC.md §4.5 苦手復習）。ジェネレータが失敗した場合はバンクにフォールバックする。
 * 符計算モードでは opts.excludeMangan で満貫以上を除外する（SPEC.md §4.0）。
 */
export function nextProblem(
  rng: RandomSource = Math.random,
  opts: NextProblemOptions = {},
): Problem {
  const stats = loadStats();

  if (chance(0.5, rng)) {
    const candidates: Problem[] = [];
    for (let i = 0; i < GENERATED_CANDIDATE_COUNT; i++) {
      const generated = generateProblem(rng);
      if (generated && isEligible(generated, opts)) candidates.push(generated);
    }
    if (candidates.length > 0) {
      const weights = candidates.map((p) => problemWeight(p, stats) * categoryBias(p));
      return weightedPick(candidates, weights, rng);
    }
  }

  const eligibleBank = problemBank.filter((p) => isEligible(p, opts));
  // 除外の結果バンクが空になる稀ケースは、絞り込まない全体から選ぶ（フォールバック）。
  const pool = eligibleBank.length > 0 ? eligibleBank : problemBank;
  const weights = pool.map((p) => problemWeight(p, stats) * categoryBias(p));
  return weightedPick(pool, weights, rng);
}
