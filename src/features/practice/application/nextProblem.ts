import problemBankRaw from "../infrastructure/problemBank.json";
import type { Problem } from "../domain/problem";
import { generateProblem } from "./generateProblem";
import { chance, type RandomSource } from "./random";
import { loadStats } from "./statsStore";
import { categoryBias, problemWeight, weightedPick } from "./weighting";

const problemBank = problemBankRaw as unknown as Problem[];
/** 生成問題は事前にタグが分からないため、複数候補を作ってから重み付けで選ぶ。
    候補が少ないと「候補全部が同じ抑制対象カテゴリ（満貫以上・七対子等）で揃う」ケースが
    無視できない確率で発生し、その回は categoryBias をどれだけ強めても抑制が効かない
    （候補3個時代は約12.5%の確率で発生し、満貫以上の出現率が目標15%まで下げられない
    要因になっていた。T-028で3→8に増やして解消。候補数を変える場合は weighting.ts の
    4バイアス値も併せて再調整すること）。 */
const GENERATED_CANDIDATE_COUNT = 8;
/** 候補集めの最大試行回数。excludeMangan（符計算・符分解モード）では生成の一部が
    満貫以上として弾かれ、固定回数だけ試すと有効な候補が1つしか残らないことがある
    （候補が少ないとカテゴリ係数による抑制が効かず、抑制対象がそのまま採用されてしまう）。
    候補数が揃うまで多めに試行し、重み付けが機能する土台を確保する
    （GENERATED_CANDIDATE_COUNT=8に対し余裕を持たせて30に設定。T-028）。 */
const MAX_CANDIDATE_ATTEMPTS = 30;

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

/** ジェネレータ生成とバンク抽選の混合比（生成側の割合）。バンク（`problemBank.json`）は
    回帰テストフィクスチャ兼用のキュレーション済み固定データで、満貫以上が53%（役満だけで
    27%）を占める偏った構成のため、バンク比率が高いと categoryBias（§4.1）でどれだけ
    満貫以上を抑制しても出現率が下限に張り付く（T-028で判明）。バンク比率を10%に下げることで
    この下限を回避する。 */
const GENERATOR_RATIO = 0.9;

/**
 * ランダムに次の出題を1つ選ぶ。ジェネレータ生成90%・バンクからのシャッフル10%で混ぜ
 * 成績（正答率の低いタグ）に基づいて苦手分野を重点的に出題する
 * ジェネレータが失敗した場合はバンクにフォールバックする。
 * 符計算モードでは opts.excludeMangan で満貫以上を除外する（SPEC.md §4.0）。
 */
export function nextProblem(
  rng: RandomSource = Math.random,
  opts: NextProblemOptions = {},
): Problem {
  const stats = loadStats();

  if (chance(GENERATOR_RATIO, rng)) {
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
