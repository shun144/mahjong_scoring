import problemBankRaw from "../data/problemBank.json";
import type { Problem } from "../data/problem";
import { generateProblem } from "../generator/generateProblem";
import { chance, type RandomSource } from "../generator/random";
import { loadStats } from "./statsStore";
import { problemWeight, weightedPick } from "./weighting";

const problemBank = problemBankRaw as unknown as Problem[];
/** 生成問題は事前にタグが分からないため、複数候補を作ってから重み付けで選ぶ。 */
const GENERATED_CANDIDATE_COUNT = 3;

/**
 * ランダムに次の出題を1つ選ぶ。バンクからのシャッフルとジェネレータ生成を半々で混ぜ
 * （SPEC.md §4.1）、成績（正答率の低いタグ）に基づいて苦手分野を重点的に出題する
 * （SPEC.md §4.5 苦手復習）。ジェネレータが失敗した場合はバンクにフォールバックする。
 */
export function nextProblem(rng: RandomSource = Math.random): Problem {
  const stats = loadStats();

  if (chance(0.5, rng)) {
    const candidates: Problem[] = [];
    for (let i = 0; i < GENERATED_CANDIDATE_COUNT; i++) {
      const generated = generateProblem(rng);
      if (generated) candidates.push(generated);
    }
    if (candidates.length > 0) {
      const weights = candidates.map((p) => problemWeight(p, stats));
      return weightedPick(candidates, weights, rng);
    }
  }

  const weights = problemBank.map((p) => problemWeight(p, stats));
  return weightedPick(problemBank, weights, rng);
}
