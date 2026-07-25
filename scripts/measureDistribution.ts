/**
 * 出題傾向バイアス（weighting.ts の categoryBias 定数群）を調整するための実測ツール。
 *
 * generateRandomHand の素の生成分布と、実際の出題関数 nextProblem() の出力分布を
 * それぞれ大量にサンプリングし、役満・七対子・満貫以上（内訳含む）の出現率を集計する。
 * MANGAN_BIAS・MANGAN_FU50_BIAS・YAKUMAN_BIAS・CHIITOI_BIAS を見直す際、
 * weighting.ts の定数を変更してから再実行し、目標レンジに収まるか確認する用途。
 *
 * 実行: npx vite-node scripts/measureDistribution.ts
 */
import { generateRandomHand } from "../src/features/practice/application/randomHand";
import { nextProblem } from "../src/features/practice/application/nextProblem";
import type { ScoreResult } from "../src/core/scoring/domain/scoreService";

const RAW_SAMPLE_SIZE = 20000;
const NEXT_PROBLEM_SAMPLE_SIZE = 5000;

type RankBucket = "none" | "mangan" | "haneman" | "baiman" | "sanbaiman" | "yakuman";
const RANK_BUCKETS: RankBucket[] = ["none", "mangan", "haneman", "baiman", "sanbaiman", "yakuman"];

interface Tally {
  total: number;
  byRank: Record<RankBucket, number>;
  chiitoi: number;
  manganPlusFu50: number;
}

function createTally(): Tally {
  return {
    total: 0,
    byRank: { none: 0, mangan: 0, haneman: 0, baiman: 0, sanbaiman: 0, yakuman: 0 },
    chiitoi: 0,
    manganPlusFu50: 0,
  };
}

function record(tally: Tally, answer: ScoreResult): void {
  tally.total++;
  const rank = (answer.rank ?? "none") as RankBucket;
  tally.byRank[rank]++;
  if (answer.yaku.some((y) => y.name.includes("七対子"))) tally.chiitoi++;
  if (answer.rank !== undefined && answer.fu >= 50) tally.manganPlusFu50++;
}

function report(label: string, tally: Tally): void {
  console.log(`\n--- ${label} (N=${tally.total}) ---`);
  for (const bucket of RANK_BUCKETS) {
    const count = tally.byRank[bucket];
    console.log(`  ${bucket}: ${count} (${((count / tally.total) * 100).toFixed(2)}%)`);
  }
  const manganPlus = tally.total - tally.byRank.none;
  console.log(`  mangan+ total: ${manganPlus} (${((manganPlus / tally.total) * 100).toFixed(2)}%)`);
  console.log(`  七対子: ${tally.chiitoi} (${((tally.chiitoi / tally.total) * 100).toFixed(2)}%)`);
  console.log(
    `  満貫以上×50符以上: ${tally.manganPlusFu50} (${((tally.manganPlusFu50 / tally.total) * 100).toFixed(2)}% of all / ${manganPlus > 0 ? ((tally.manganPlusFu50 / manganPlus) * 100).toFixed(2) : "—"}% of mangan+)`,
  );
}

function measureRaw(): void {
  const tally = createTally();
  let generated = 0;
  while (generated < RAW_SAMPLE_SIZE) {
    const hand = generateRandomHand(Math.random);
    if (!hand) continue;
    generated++;
    record(tally, hand.answer);
  }
  report("generateRandomHand（素の生成分布）", tally);
}

function measureNextProblem(): void {
  const tally = createTally();
  for (let i = 0; i < NEXT_PROBLEM_SAMPLE_SIZE; i++) {
    const problem = nextProblem(Math.random);
    record(tally, problem.answer);
  }
  report("nextProblem（実際の出題分布。生成75%+バンク25%・categoryBias適用後）", tally);
}

measureRaw();
measureNextProblem();
