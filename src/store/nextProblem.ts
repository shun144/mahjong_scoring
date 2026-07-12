import problemBankRaw from "../data/problemBank.json";
import type { Problem } from "../data/problem";
import { generateProblem } from "../generator/generateProblem";
import { chance, type RandomSource } from "../generator/random";
import { loadStats } from "./statsStore";
import { categoryBias, problemWeight, weightedPick } from "./weighting";

const problemBank = problemBankRaw as unknown as Problem[];
/** 生成問題は事前にタグが分からないため、複数候補を作ってから重み付けで選ぶ。 */
const GENERATED_CANDIDATE_COUNT = 3;
/** 候補集めの最大試行回数。excludeMangan（符計算・符分解モード）では生成の一部が
    満貫以上として弾かれ、固定回数だけ試すと有効な候補が1つしか残らないことがある
    （候補が少ないとカテゴリ係数による抑制が効かず、抑制対象がそのまま採用されてしまう）。
    候補数が揃うまで多めに試行し、重み付けが機能する土台を確保する。 */
const MAX_CANDIDATE_ATTEMPTS = 12;

/** 符計算モードでは満貫以上（符が点数に影響しない区分）を出題しない（SPEC.md §4.0）。 */
export interface NextProblemOptions {
  excludeMangan?: boolean;
  /** 七対子の出題頻度バイアスをモード別に上書きする（既定は categoryBias の CHIITOI_BIAS）。 */
  chiitoiBias?: number;
}

/** 出題対象として妥当か。excludeMangan 時は満貫以上（rank 付き）を除く。 */
function isEligible(problem: Problem, opts: NextProblemOptions): boolean {
  if (opts.excludeMangan && problem.answer.rank !== undefined) return false;
  return true;
}

/**
 * ランダムに次の出題を1つ選ぶ。ジェネレータ生成75%・バンクからのシャッフル25%で混ぜ
 * （SPEC.md §4.1）、成績（正答率の低いタグ）に基づいて苦手分野を重点的に出題する
 * （SPEC.md §4.5 苦手復習）。ジェネレータが失敗した場合はバンクにフォールバックする。
 * 符計算モードでは opts.excludeMangan で満貫以上を除外する（SPEC.md §4.0）。
 */
export function nextProblem(
  rng: RandomSource = Math.random,
  opts: NextProblemOptions = {},
): Problem {
  const stats = loadStats();

  // 生成75% / バンク25%（chance が true のとき生成側）。
  if (chance(0.75, rng)) {
    const candidates: Problem[] = [];
    for (
      let i = 0;
      i < MAX_CANDIDATE_ATTEMPTS && candidates.length < GENERATED_CANDIDATE_COUNT;
      i++
    ) {
      const generated = generateProblem(rng);
      if (generated && isEligible(generated, opts)) candidates.push(generated);
    }
    if (candidates.length > 0) {
      const weights = candidates.map(
        (p) => problemWeight(p, stats) * categoryBias(p, opts.chiitoiBias),
      );
      return weightedPick(candidates, weights, rng);
    }
  }

  const eligibleBank = problemBank.filter((p) => isEligible(p, opts));
  // 除外の結果バンクが空になる稀ケースは、絞り込まない全体から選ぶ（フォールバック）。
  const pool = eligibleBank.length > 0 ? eligibleBank : problemBank;
  const weights = pool.map((p) => problemWeight(p, stats) * categoryBias(p, opts.chiitoiBias));
  return weightedPick(pool, weights, rng);
}
