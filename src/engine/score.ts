import type { WinType } from "./model";
import type { FuBreakdown } from "./fu";

export type { FuBreakdown, FuItem } from "./fu";

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

/** 翻数から満貫以上の区分を判定する。区分なし(null)の場合は符×翻の通常計算を使う。 */
export function determineRank(han: number, fu: number): ScoreRank | null {
  if (han >= 13) return "yakuman";
  if (han >= 11) return "sanbaiman";
  if (han >= 8) return "baiman";
  if (han >= 6) return "haneman";
  const basicPoints = fu * Math.pow(2, 2 + han);
  if (basicPoints >= 2000) return "mangan";
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
): { payment: Payment; rank: ScoreRank | null } {
  const rank = determineRank(han, fu);

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
