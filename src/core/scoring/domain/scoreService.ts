import type { WinType } from "./matchContext";
import type { FuBreakdown, FuElementBreakdown } from "./fuService";

export type { FuBreakdown, FuElementBreakdown, FuItem } from "./fuService";

export interface YakuResult {
  name: string;
  han: number;
}

export type Payment =
  | { kind: "ron"; total: number }
  | { kind: "tsumo-ko"; nonDealer: number; dealer: number }
  | { kind: "tsumo-oya"; each: number };

export type ScoreRank = "mangan" | "haneman" | "baiman" | "sanbaiman" | "yakuman";

export interface ScoreResult {
  yaku: YakuResult[];
  han: number;
  fu: number;
  payment: Payment;
  rank?: ScoreRank;
  interpretationNote?: string;
  /** 符の内訳（解説表示用）。満貫以上など符が点数に影響しない場合は省略され得る。 */
  fuDetail?: FuBreakdown;
  /**
   * 符の要素別内訳（符分解モード用。SPEC.md §4.10）。
   * scoreHand に opts.includeFuElements を渡した場合のみ含まれる
   * （既定では省略され、既存のバンク回帰テストの比較に影響しない）。
   */
  fuElements?: FuElementBreakdown;
}

function roundUp100(n: number): number {
  return Math.ceil(n / 100) * 100;
}

const RANK_TABLE: Record<
  ScoreRank,
  {
    ronKo: number;
    ronOya: number;
    tsumoKoFromKo: number;
    tsumoKoFromOya: number;
    tsumoOyaEach: number;
  }
> = {
  mangan: { ronKo: 8000, ronOya: 12000, tsumoKoFromKo: 2000, tsumoKoFromOya: 4000, tsumoOyaEach: 4000 },
  haneman: { ronKo: 12000, ronOya: 18000, tsumoKoFromKo: 3000, tsumoKoFromOya: 6000, tsumoOyaEach: 6000 },
  baiman: { ronKo: 16000, ronOya: 24000, tsumoKoFromKo: 4000, tsumoKoFromOya: 8000, tsumoOyaEach: 8000 },
  sanbaiman: { ronKo: 24000, ronOya: 36000, tsumoKoFromKo: 6000, tsumoKoFromOya: 12000, tsumoOyaEach: 12000 },
  yakuman: { ronKo: 32000, ronOya: 48000, tsumoKoFromKo: 8000, tsumoKoFromOya: 16000, tsumoOyaEach: 16000 },
};

/** 満貫とみなす基本点のしきい値（通常ルール）。 */
const MANGAN_BASIC_POINTS = 2000;
/**
 * 切り上げ満貫ルールのしきい値。4翻30符・3翻60符（基本点1920）も満貫に切り上げる。
 * これを満貫扱いにすると 子ロン7700→8000／親ロン11600→12000／
 * 子ツモ2000-3900→2000-4000／親ツモ3900オール→4000オール となる。
 */
const ROUNDED_UP_MANGAN_BASIC_POINTS = 1920;

export interface RankOptions {
  /**
   * 切り上げ満貫を適用するか。
   * 既定は false（現行の「切り上げない」ルール。CLAUDE.md/SPEC の既定に準拠）。
   * true にすると 4翻30符・3翻60符 を満貫へ切り上げる。
   *
   * 注意: 既定の計算経路（scoreHand 等）はこのオプションを渡さないため、
   * 追加しても実際の採点結果は変わらない。将来ルールを切り替える際の受け口。
   */
  roundUpMangan?: boolean;
}

/** 翻数から満貫以上の区分を判定する。区分なし(null)の場合は符×翻の通常計算を使う。 */
export function determineRank(han: number, fu: number, options: RankOptions = {}): ScoreRank | null {
  if (han >= 13) return "yakuman";
  if (han >= 11) return "sanbaiman";
  if (han >= 8) return "baiman";
  if (han >= 6) return "haneman";
  const manganThreshold = options.roundUpMangan
    ? ROUNDED_UP_MANGAN_BASIC_POINTS
    : MANGAN_BASIC_POINTS;
  if (basicPoints(han, fu) >= manganThreshold) return "mangan";
  return null;
}

/** 基本点 = 符 × 2^(2+翻)。満貫未満の通常計算にのみ使用。 */
export function basicPoints(han: number, fu: number): number {
  return fu * Math.pow(2, 2 + han);
}

/** 翻・符・親子・ツモ/ロンから支払い額を算出する。 */
export function calculatePayment(
  han: number,
  fu: number,
  isDealer: boolean,
  winType: WinType,
  options: RankOptions = {},
): { payment: Payment; rank: ScoreRank | null } {
  const rank = determineRank(han, fu, options);

  if (rank) {
    const t = RANK_TABLE[rank];
    if (winType === "ron") {
      return { payment: { kind: "ron", total: isDealer ? t.ronOya : t.ronKo }, rank };
    }
    if (isDealer) {
      return { payment: { kind: "tsumo-oya", each: t.tsumoOyaEach }, rank };
    }
    return {
      payment: { kind: "tsumo-ko", nonDealer: t.tsumoKoFromKo, dealer: t.tsumoKoFromOya },
      rank,
    };
  }

  const basic = basicPoints(han, fu);
  if (winType === "ron") {
    const multiplier = isDealer ? 6 : 4;
    return { payment: { kind: "ron", total: roundUp100(basic * multiplier) }, rank: null };
  }
  if (isDealer) {
    return { payment: { kind: "tsumo-oya", each: roundUp100(basic * 2) }, rank: null };
  }
  return {
    payment: {
      kind: "tsumo-ko",
      nonDealer: roundUp100(basic * 1),
      dealer: roundUp100(basic * 2),
    },
    rank: null,
  };
}

/** Payment から総取得点（比較用の単一数値）を算出する。高点法の比較に使う。 */
export function paymentTotal(payment: Payment): number {
  if (payment.kind === "ron") return payment.total;
  if (payment.kind === "tsumo-oya") return payment.each * 3;
  // tsumo-ko: 子の総取得 = 他家の子2人分 + 親1人分
  return payment.nonDealer * 2 + payment.dealer;
}
