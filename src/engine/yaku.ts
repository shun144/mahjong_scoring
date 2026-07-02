import type { HandSet, StandardInterpretation } from "./interpretation";
import { HONOR_NAMES, type Wind, type WinType } from "./model";
import { isPinfuShape } from "./fu";
import type { YakuResult } from "./score";
import { isHonorType, isTerminalOrHonor, typeToTile } from "./tileType";

export interface YakuContext {
  isMenzen: boolean;
  winType: WinType;
  riichi: boolean;
  seatWind: Wind;
  roundWind: Wind;
}

const SANGEN_TYPES = [31, 32, 33]; // 白發中

function windToType(wind: Wind): number {
  return { east: 27, south: 28, west: 29, north: 30 }[wind];
}

export function setMemberTypes(set: HandSet): number[] {
  if (set.kind === "sequence") {
    return [set.tileType, set.tileType + 1, set.tileType + 2];
  }
  return [set.tileType];
}

export function allMemberTypes(interp: StandardInterpretation): number[] {
  return [...interp.sets.flatMap(setMemberTypes), interp.pair.tileType];
}

function isSequenceTypeStartingAt(set: HandSet, lo: number): boolean {
  return set.kind === "sequence" && set.tileType === lo;
}

/** 順子が老頭牌(1 or 9)に接するか（123 or 789）。 */
function sequenceTouchesTerminal(set: HandSet): boolean {
  const rankInSuit = set.tileType % 9; // 0=1,6=7
  return rankInSuit === 0 || rankInSuit === 6;
}

function groupTouchesTerminalOrHonor(set: HandSet): boolean {
  if (set.kind === "triplet") return isTerminalOrHonor(set.tileType);
  return sequenceTouchesTerminal(set);
}

/**
 * 標準形（4面子1雀頭）の役を判定する。
 * 役満はこの関数の対象外（scoreHand側で個別に判定し、複合させず単独で扱う）。
 */
export function detectStandardYaku(
  interp: StandardInterpretation,
  ctx: YakuContext,
): YakuResult[] {
  const results: YakuResult[] = [];
  const allTypes = allMemberTypes(interp);

  // --- 1翻 ---
  if (ctx.riichi) results.push({ name: "リーチ", han: 1 });
  if (ctx.isMenzen && ctx.winType === "tsumo") {
    results.push({ name: "門前清自摸和", han: 1 });
  }
  if (isPinfuShape(interp, { isMenzen: ctx.isMenzen, winType: ctx.winType, seatWind: ctx.seatWind, roundWind: ctx.roundWind })) {
    results.push({ name: "平和", han: 1 });
  }
  if (allTypes.every((t) => !isTerminalOrHonor(t))) {
    results.push({ name: "断幺九", han: 1 });
  }

  // 一盃口 / 二盃口（順子の重複ペア数で判定）
  if (ctx.isMenzen) {
    const seqFreq = new Map<number, number>();
    for (const s of interp.sets) {
      if (s.kind === "sequence") seqFreq.set(s.tileType, (seqFreq.get(s.tileType) ?? 0) + 1);
    }
    let duplicatePairs = 0;
    for (const c of seqFreq.values()) duplicatePairs += Math.floor(c / 2);
    if (duplicatePairs >= 2) {
      results.push({ name: "二盃口", han: 3 });
    } else if (duplicatePairs === 1) {
      results.push({ name: "一盃口", han: 1 });
    }
  }

  // 役牌（三元牌・自風・場風。連風は自風/場風それぞれ加算されるため合計2翻になり得る）
  for (const set of interp.sets) {
    if (set.kind !== "triplet") continue;
    const honorName = isHonorType(set.tileType) ? HONOR_NAMES[typeToTile(set.tileType).rank].kanji : "";
    if (SANGEN_TYPES.includes(set.tileType)) {
      results.push({ name: `役牌(${honorName})`, han: 1 });
    }
    if (set.tileType === windToType(ctx.seatWind)) {
      results.push({ name: `役牌(自風・${honorName})`, han: 1 });
    }
    if (set.tileType === windToType(ctx.roundWind)) {
      results.push({ name: `役牌(場風・${honorName})`, han: 1 });
    }
  }

  // --- 2翻 ---
  // 三色同順
  for (let lo = 0; lo <= 6; lo++) {
    const hasM = interp.sets.some((s) => isSequenceTypeStartingAt(s, lo));
    const hasP = interp.sets.some((s) => isSequenceTypeStartingAt(s, lo + 9));
    const hasS = interp.sets.some((s) => isSequenceTypeStartingAt(s, lo + 18));
    if (hasM && hasP && hasS) {
      results.push({ name: "三色同順", han: ctx.isMenzen ? 2 : 1 });
      break;
    }
  }

  // 一気通貫
  for (const base of [0, 9, 18]) {
    const has123 = interp.sets.some((s) => isSequenceTypeStartingAt(s, base));
    const has456 = interp.sets.some((s) => isSequenceTypeStartingAt(s, base + 3));
    const has789 = interp.sets.some((s) => isSequenceTypeStartingAt(s, base + 6));
    if (has123 && has456 && has789) {
      results.push({ name: "一気通貫", han: ctx.isMenzen ? 2 : 1 });
      break;
    }
  }

  // 混全帯幺九 / 純全帯幺九
  const allGroupsTouchTerminalOrHonor =
    interp.sets.every(groupTouchesTerminalOrHonor) && isTerminalOrHonor(interp.pair.tileType);
  if (allGroupsTouchTerminalOrHonor) {
    const usesHonor = allTypes.some(isHonorType);
    if (usesHonor) {
      results.push({ name: "混全帯幺九", han: ctx.isMenzen ? 2 : 1 });
    } else {
      results.push({ name: "純全帯幺九", han: ctx.isMenzen ? 3 : 2 });
    }
  }

  // 対々和
  const allTriplets = interp.sets.every((s) => s.kind === "triplet");
  if (allTriplets) {
    results.push({ name: "対々和", han: 2 });
  }

  // 三暗刻
  const ankouCount = interp.sets.filter((s) => s.kind === "triplet" && s.concealed).length;
  if (ankouCount >= 3) {
    results.push({ name: "三暗刻", han: 2 });
  }

  // 三色同刻
  for (let rank = 0; rank <= 8; rank++) {
    const hasM = interp.sets.some((s) => s.kind === "triplet" && s.tileType === rank);
    const hasP = interp.sets.some((s) => s.kind === "triplet" && s.tileType === rank + 9);
    const hasS = interp.sets.some((s) => s.kind === "triplet" && s.tileType === rank + 18);
    if (hasM && hasP && hasS) {
      results.push({ name: "三色同刻", han: 2 });
      break;
    }
  }

  // 三槓子（四槓子は役満側で判定し、こちらは重複させない）
  const kanCount = interp.sets.filter((s) => s.isKan).length;
  if (kanCount === 3) {
    results.push({ name: "三槓子", han: 2 });
  }

  // 混老頭
  if (allTriplets && allTypes.every(isTerminalOrHonor) && allTypes.some(isHonorType) && allTypes.some((t) => !isHonorType(t))) {
    results.push({ name: "混老頭", han: 2 });
  }

  // 小三元
  const dragonTripletCount = interp.sets.filter(
    (s) => s.kind === "triplet" && SANGEN_TYPES.includes(s.tileType),
  ).length;
  if (dragonTripletCount === 2 && SANGEN_TYPES.includes(interp.pair.tileType)) {
    results.push({ name: "小三元", han: 2 });
  }

  // --- 3翻 ---
  // 混一色 / 清一色
  const suitsUsed = new Set(
    allTypes.filter((t) => !isHonorType(t)).map((t) => Math.floor(t / 9)),
  );
  const hasHonorTile = allTypes.some(isHonorType);
  if (suitsUsed.size === 1) {
    if (hasHonorTile) {
      results.push({ name: "混一色", han: ctx.isMenzen ? 3 : 2 });
    } else {
      results.push({ name: "清一色", han: ctx.isMenzen ? 6 : 5 });
    }
  }

  return results;
}
