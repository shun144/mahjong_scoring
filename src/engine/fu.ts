import type { HandSet, StandardInterpretation, WaitKind } from "./interpretation";
import type { Wind, WinType } from "./model";
import { isTerminalOrHonor } from "./tileType";

export interface FuContext {
  /** 副露が一つも無い（門前）かどうか。 */
  isMenzen: boolean;
  winType: WinType;
  seatWind: Wind;
  roundWind: Wind;
}

const SANGEN_TYPES = [31, 32, 33]; // 白發中

function windToHonorType(wind: Wind): number {
  const rank = { east: 1, south: 2, west: 3, north: 4 }[wind];
  return 27 + (rank - 1);
}

/** 雀頭が役牌（三元牌／自風／場風）かどうか。 */
export function isYakuhaiPairType(tileType: number, ctx: FuContext): boolean {
  if (SANGEN_TYPES.includes(tileType)) return true;
  if (tileType === windToHonorType(ctx.seatWind)) return true;
  if (tileType === windToHonorType(ctx.roundWind)) return true;
  return false;
}

/** 平和の形（門前・全て順子・雀頭が役牌でない・両面待ち）かどうか。 */
export function isPinfuShape(interp: StandardInterpretation, ctx: FuContext): boolean {
  if (!ctx.isMenzen) return false;
  if (interp.sets.some((s) => s.kind !== "sequence")) return false;
  if (isYakuhaiPairType(interp.pair.tileType, ctx)) return false;
  const winningSet = interp.sets.find((s) => s.isWinningGroup);
  if (!winningSet) return false;
  return winningSet.waitKind === "ryanmen";
}

function setFu(set: HandSet): number {
  if (set.kind === "sequence") return 0;
  const isTermHonor = isTerminalOrHonor(set.tileType);
  if (set.isKan) {
    return set.concealed ? (isTermHonor ? 32 : 16) : isTermHonor ? 16 : 8;
  }
  return set.concealed ? (isTermHonor ? 8 : 4) : isTermHonor ? 4 : 2;
}

function waitFu(waitKind: WaitKind | undefined): number {
  if (waitKind === "kanchan" || waitKind === "penchan" || waitKind === "tanki") return 2;
  return 0; // ryanmen, shanpon
}

/**
 * 4面子1雀頭形の符を計算する（SPEC.md §5.2）。
 * 七対子は固定25符のためこの関数の対象外（呼び出し側で分岐する）。
 */
export function calculateFu(interp: StandardInterpretation, ctx: FuContext): number {
  const pinfu = isPinfuShape(interp, ctx);

  if (pinfu) {
    return ctx.winType === "tsumo" ? 20 : 30;
  }

  let fu = 20; // 副底

  if (ctx.isMenzen && ctx.winType === "ron") fu += 10;
  if (ctx.winType === "tsumo") fu += 2;

  for (const set of interp.sets) {
    fu += setFu(set);
  }

  if (isYakuhaiPairType(interp.pair.tileType, ctx)) fu += 2;

  const winningSet = interp.sets.find((s) => s.isWinningGroup);
  const waitKind: WaitKind | undefined =
    winningSet?.waitKind ?? (interp.pair.isWinningGroup ? "tanki" : undefined);
  fu += waitFu(waitKind);

  // 喰い平和形のロン（鳴きで符が一切付かない20符形）は30符に切り上げる。
  if (fu === 20 && ctx.winType === "ron" && !ctx.isMenzen) {
    fu = 30;
  }

  return Math.ceil(fu / 10) * 10;
}
