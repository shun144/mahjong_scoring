import type { HandSet, StandardInterpretation, WaitKind } from "./interpretation";
import type { Wind, WinType } from "./model";
import { isTerminalOrHonor, windToHonorType } from "./tileType";

export interface FuContext {
  isMenzen: boolean;
  winType: WinType;
  seatWind: Wind;
  roundWind: Wind;
}

/** 符計算の1要素（解説画面の内訳表示用）。 */
export interface FuItem {
  label: string;
  /** この要素の符（集約時は count 個ぶんの合計）。 */
  fu: number;
  /** 同種の面子を集約した個数。1 または未指定なら単一。 */
  count?: number;
}

/** 符計算の内訳（SPEC.md §5.2）。合計 total は calculateFu と一致する。 */
export interface FuBreakdown {
  items: FuItem[];
  /** 切り上げ前の合計。固定符（平和/七対子等）では total と同じ。 */
  subtotal: number;
  /** 10符切り上げ後の最終符。 */
  total: number;
  /** 平和・七対子など固定符で、切り上げ計算を伴わない場合 true。 */
  fixed: boolean;
  /** 喰い平和形の切り上げ等、補足があれば記す。 */
  note?: string;
}

const WAIT_LABELS: Record<WaitKind, string> = {
  ryanmen: "両面(リャンメン)",
  kanchan: "嵌張(カンチャン)",
  penchan: "辺張(ペンチャン)",
  shanpon: "双碰(シャンポン)",
  tanki: "単騎(タンキ)",
};

function meldFuLabel(set: HandSet): string {
  const grade = isTerminalOrHonor(set.tileType) ? "幺九" : "中張";
  const base = set.isKan ? (set.concealed ? "暗槓" : "明槓") : set.concealed ? "暗刻" : "明刻";
  return `${base}(${grade})`;
}

const SANGEN_TYPES = [31, 32, 33]; // 白發中

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

/** 符計算の内訳計算オプション。 */
export interface FuBreakdownOptions {
  /**
   * +0符の要素（順子・非役牌の雀頭・両面/双碰待ち）も内訳に含めるか。
   * 符計算モードの解説で「全手順」を見せるための表示専用フラグ。
   * 0符要素は subtotal/total を変えないため、既定(false)の出力は不変。
   */
  includeZeroFu?: boolean;
}

/**
 * 4面子1雀頭形の符を計算し、内訳付きで返す（SPEC.md §5.2）。
 * 七対子は固定25符のためこの関数の対象外（呼び出し側で分岐する）。
 */
export function calculateFuBreakdown(
  interp: StandardInterpretation,
  ctx: FuContext,
  opts: FuBreakdownOptions = {},
): FuBreakdown {
  // 平和形は固定符（ツモ20／ロン30）。
  if (isPinfuShape(interp, ctx)) {
    if (ctx.winType === "tsumo") {
      return { items: [{ label: "平和ツモ(固定)", fu: 20 }], subtotal: 20, total: 20, fixed: true };
    }
    return {
      items: [
        { label: "基本符", fu: 20 },
        { label: "門前ロン", fu: 10 },
      ],
      subtotal: 30,
      total: 30,
      fixed: false,
    };
  }

  const items: FuItem[] = [{ label: "基本符", fu: 20 }];

  if (ctx.winType === "ron") {
    // 門前ロンは+10符。鳴き手のロンは門前加符が付かない(0符)ため、
    // includeZeroFu 時のみ「ロン(鳴き)」として明示する。
    if (ctx.isMenzen) {
      items.push({ label: "門前ロン", fu: 10 });
    } else if (opts.includeZeroFu) {
      items.push({ label: "ロン(鳴き)", fu: 0 });
    }
  }
  if (ctx.winType === "tsumo") items.push({ label: "ツモ", fu: 2 });

  // 面子の符は同種（同じラベル）をまとめて「... ×N」で表示する。
  // 順子(0符)は内訳に出さない（includeZeroFu でも表示しない）。
  for (const set of interp.sets) {
    const setValue = setFu(set);
    if (setValue === 0) continue;
    const label = meldFuLabel(set);
    const existing = items.find((item) => item.label === label);
    if (existing) {
      existing.fu += setValue;
      existing.count = (existing.count ?? 1) + 1;
    } else {
      items.push({ label, fu: setValue, count: 1 });
    }
  }

  // 役牌雀頭は+2符。非役牌の雀頭(0符)は includeZeroFu 時のみ「雀頭 +0符」で表示する。
  if (isYakuhaiPairType(interp.pair.tileType, ctx)) {
    items.push({ label: "雀頭(役牌)", fu: 2 });
  } else if (opts.includeZeroFu) {
    items.push({ label: "雀頭", fu: 0 });
  }

  const winningSet = interp.sets.find((s) => s.isWinningGroup);
  const waitKind: WaitKind | undefined =
    winningSet?.waitKind ?? (interp.pair.isWinningGroup ? "tanki" : undefined);
  // 加符のある待ち（嵌張・辺張・単騎）を表示する。両面・双碰(0符)は includeZeroFu 時のみ表示する。
  if (waitKind && (waitFu(waitKind) > 0 || opts.includeZeroFu)) {
    items.push({ label: `待ち: ${WAIT_LABELS[waitKind]}`, fu: waitFu(waitKind) });
  }

  const subtotal = items.reduce((sum, item) => sum + item.fu, 0);

  // 喰い平和形のロン（鳴きで符が一切付かない20符形）は30符に切り上げる。
  if (subtotal === 20 && ctx.winType === "ron" && !ctx.isMenzen) {
    return { items, subtotal, total: 30, fixed: false, note: "喰い平和形のため30符に切り上げ" };
  }

  return { items, subtotal, total: Math.ceil(subtotal / 10) * 10, fixed: false };
}

/**
 * 4面子1雀頭形の符（合計値）を計算する（SPEC.md §5.2）。
 * 七対子は固定25符のためこの関数の対象外（呼び出し側で分岐する）。
 */
export function calculateFu(interp: StandardInterpretation, ctx: FuContext): number {
  return calculateFuBreakdown(interp, ctx).total;
}

/** 七対子の符内訳（25符固定・SPEC.md §5.2）。標準形とは別扱いのためここに集約する。 */
export function chiitoitsuFuBreakdown(): FuBreakdown {
  return {
    items: [{ label: "七対子(固定)", fu: 25 }],
    subtotal: 25,
    total: 25,
    fixed: true,
  };
}

/**
 * 符分解モード（SPEC.md §4.10）用の要素別内訳。
 * calculateFuBreakdown の内訳（FuItem.label）には依存せず、標準形の符計算を
 * 「上がり方／面子の符合計／雀頭／待ち」の4要素に直接分解する。
 * 平和ツモ・七対子など固定符の手は分解せず fixed を返す（七対子は chiitoitsuFuElements を使う）。
 */
export type FuElementBreakdown =
  | {
      kind: "standard";
      /** 上がり方: 門前ロン=10 / ツモ=2 / 鳴きロン=0。 */
      winMethod: number;
      /** 4面子の符の合計（順子は0符のため寄与しない）。 */
      meldTotal: number;
      /** 雀頭: 役牌(三元牌/自風/場風)=2 / それ以外=0。 */
      pair: number;
      /** 待ち: 嵌張・辺張・単騎=2 / 両面・双碰=0。 */
      wait: number;
      /** 切り上げ前の合計（20+winMethod+meldTotal+pair+wait）。 */
      subtotal: number;
      /** 10符切り上げ後の最終符。 */
      total: number;
      /** 喰い平和形の切り上げ等、補足があれば記す。 */
      note?: string;
    }
  | {
      kind: "fixed";
      /** 平和ツモ=20 / 七対子=25。 */
      fu: number;
    };

/**
 * 4面子1雀頭形の符を要素別に分解する（SPEC.md §4.10）。
 * 平和ロン（30符＝副底20＋門前ロン10）は fixed にならないため標準4要素として分解する
 * （上がり方=10・他0）。平和ツモのみ固定符として扱う。
 */
export function calculateFuElements(
  interp: StandardInterpretation,
  ctx: FuContext,
): FuElementBreakdown {
  if (isPinfuShape(interp, ctx)) {
    if (ctx.winType === "tsumo") return { kind: "fixed", fu: 20 };
    return {
      kind: "standard",
      winMethod: 10,
      meldTotal: 0,
      pair: 0,
      wait: 0,
      subtotal: 30,
      total: 30,
    };
  }

  const winMethod = ctx.winType === "ron" ? (ctx.isMenzen ? 10 : 0) : 2;
  const meldTotal = interp.sets.reduce((sum, set) => sum + setFu(set), 0);
  const pair = isYakuhaiPairType(interp.pair.tileType, ctx) ? 2 : 0;

  const winningSet = interp.sets.find((s) => s.isWinningGroup);
  const waitKind: WaitKind | undefined =
    winningSet?.waitKind ?? (interp.pair.isWinningGroup ? "tanki" : undefined);
  const wait = waitFu(waitKind);

  const subtotal = 20 + winMethod + meldTotal + pair + wait;

  // 喰い平和形のロン（鳴きで符が一切付かない20符形）は30符に切り上げる（calculateFuBreakdownと同条件）。
  if (subtotal === 20 && ctx.winType === "ron" && !ctx.isMenzen) {
    return {
      kind: "standard",
      winMethod,
      meldTotal,
      pair,
      wait,
      subtotal,
      total: 30,
      note: "喰い平和形のため30符に切り上げ",
    };
  }

  return {
    kind: "standard",
    winMethod,
    meldTotal,
    pair,
    wait,
    subtotal,
    total: Math.ceil(subtotal / 10) * 10,
  };
}

/** 七対子の符要素（25符固定・SPEC.md §4.10）。 */
export function chiitoitsuFuElements(): FuElementBreakdown {
  return { kind: "fixed", fu: 25 };
}
