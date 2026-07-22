import type { StandardInterpretation } from "./interpretationService";
import type { YakuResult } from "./scoreService";
import { isGreenType, isHonorType, isTerminal, isSangenType, isWindType } from "./tile";
import { allMemberTypes } from "./yakuService";

// const SANGEN_TYPES = [31, 32, 33]; // 白發中
// const WIND_TYPES = [27, 28, 29, 30]; // 東南西北

export interface YakumanContext {
  isMenzen: boolean;
}

/**
 * 役満を判定する（国士無双を除く。国士無双は形自体が特殊なため呼び出し側で別処理）。
 * 標準ルールにより役満同士の複合・ダブル役満は考慮しない（呼び出し側で単独採用する）。
 */
export function detectYakuman(
  interp: StandardInterpretation,
  ctx: YakumanContext,
  concealedCounts: readonly number[],
): YakuResult[] {
  const results: YakuResult[] = [];
  const allTypes = allMemberTypes(interp);

  // 四暗刻: 4面子すべてが暗刻/暗槓
  const ankouCount = interp.sets.filter((s) => s.kind === "triplet" && s.concealed).length;
  if (ankouCount === 4) {
    results.push({ name: "四暗刻", han: 13 });
  }

  // 大三元: 三元牌が3つとも刻子/槓子
  const dragonTripletCount = interp.sets.filter(
    (s) => s.kind === "triplet" && isSangenType(s.tileType),
  ).length;
  if (dragonTripletCount === 3) {
    results.push({ name: "大三元", han: 13 });
  }

  // 字一色: 全て字牌
  if (allTypes.every(isHonorType)) {
    results.push({ name: "字一色", han: 13 });
  }

  // 緑一色
  if (allTypes.every(isGreenType)) {
    results.push({ name: "緑一色", han: 13 });
  }

  // 清老頭: 全て老頭牌(1,9)の刻子、字牌なし
  if (interp.sets.every((s) => s.kind === "triplet") && allTypes.every(isTerminal)) {
    results.push({ name: "清老頭", han: 13 });
  }

  // 小四喜・大四喜
  const windTripletCount = interp.sets.filter(
    (s) => s.kind === "triplet" && isWindType(s.tileType),
  ).length;
  if (windTripletCount === 4) {
    results.push({ name: "大四喜", han: 13 });
  } else if (windTripletCount === 3 && isWindType(interp.pair.tileType)) {
    results.push({ name: "小四喜", han: 13 });
  }

  // 四槓子
  const kanCount = interp.sets.filter((s) => s.isKan).length;
  if (kanCount === 4) {
    results.push({ name: "四槓子", han: 13 });
  }

  // 九蓮宝燈: 門前・単一数牌スートで 1112345678999 + 任意の1枚
  if (ctx.isMenzen) {
    const chuuren = detectChuurenpoutou(concealedCounts);
    if (chuuren) {
      results.push({ name: "九蓮宝燈", han: 13 });
    }
  }

  return results;
}

function detectChuurenpoutou(counts: readonly number[]): boolean {
  for (const base of [0, 9, 18]) {
    const suitCounts = counts.slice(base, base + 9);
    const otherTotal =
      counts.slice(0, base).reduce((a, b) => a + b, 0) +
      counts.slice(base + 9).reduce((a, b) => a + b, 0);
    if (otherTotal > 0) continue;
    const total = suitCounts.reduce((a, b) => a + b, 0);
    if (total !== 14) continue;
    if (suitCounts[0] < 3 || suitCounts[8] < 3) continue;
    if (suitCounts.slice(1, 8).some((c) => c < 1)) continue;
    return true;
  }
  return false;
}
