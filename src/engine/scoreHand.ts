import { countAkaDora, countDoraFromIndicators } from "./dora";
import {
  calculateFuBreakdown,
  chiitoitsuFuBreakdown,
  type FuBreakdown,
  type FuBreakdownOptions,
} from "./fu";
import { buildStandardInterpretations, type StandardInterpretation } from "./interpretation";
import { decomposeChiitoitsu, decomposeKokushi } from "./decompose";
import type { Meld, Tile, Wind, WinType } from "./model";
import { calculatePayment, paymentTotal, type ScoreResult, type YakuResult } from "./score";
import { isHonorType, isTerminalOrHonor, tileToType, tilesToCounts } from "./tileType";
import { detectStandardYaku } from "./yaku";
import { detectYakuman } from "./yakuman";

export interface ScoreHandInput {
  /** 純手牌（副露を除く。上がり牌を含む）。 */
  concealed: Tile[];
  melds: Meld[];
  winningTile: Tile;
  winType: WinType;
  /** ドラ表示牌（実際のドラはここから読み替える。SPEC.md §5.4）。 */
  doraIndicators: Tile[];
  /** 裏ドラ表示牌（リーチ時のみ渡す想定）。 */
  uraDoraIndicators: Tile[];
  seatWind: Wind;
  roundWind: Wind;
  isDealer: boolean;
  riichi: boolean;
}

interface Candidate {
  yaku: YakuResult[];
  han: number;
  fu: number;
  isYakuman: boolean;
  fuDetail?: FuBreakdown;
}

function isMenzenHand(melds: readonly Meld[]): boolean {
  return !melds.some((m) => m.type !== "ankan");
}

function buildCandidateResult(
  candidate: Candidate,
  isDealer: boolean,
  winType: WinType,
): ScoreResult {
  const { payment, rank } = calculatePayment(candidate.han, candidate.fu, isDealer, winType);
  return {
    yaku: candidate.yaku,
    han: candidate.han,
    fu: candidate.fu,
    payment,
    rank: rank ?? undefined,
    fuDetail: candidate.fuDetail,
  };
}

/**
 * 和了形を採点する。高点法により最高得点の解釈を選び、
 * 次点の解釈があれば interpretationNote に記す。
 * 有効な役が一つも無い場合は null を返す（本来は出題側で防ぐべき不正な手）。
 *
 * opts.includeZeroFu を渡すと fuDetail に0符要素も含める（符計算モードの解説表示用）。
 * 0符要素は点数に影響しないため、採点結果(han/fu/payment)は opts の有無で変わらない。
 */
export function scoreHand(
  input: ScoreHandInput,
  opts: FuBreakdownOptions = {},
): ScoreResult | null {
  const isMenzen = isMenzenHand(input.melds);
  const concealedCounts = tilesToCounts(input.concealed);
  const winTileType = tileToType(input.winningTile);
  const meldsNeeded = 4 - input.melds.length;

  const allHandTiles = [...input.concealed, ...input.melds.flatMap((m) => m.tiles)];
  const doraHan = countDoraFromIndicators(allHandTiles, input.doraIndicators);
  const akaHan = countAkaDora(allHandTiles);
  const uraHan = input.riichi ? countDoraFromIndicators(allHandTiles, input.uraDoraIndicators) : 0;
  const bonusHan = doraHan + akaHan + uraHan;
  const doraYaku: YakuResult[] = [];
  if (doraHan > 0) doraYaku.push({ name: "ドラ", han: doraHan });
  if (akaHan > 0) doraYaku.push({ name: "赤ドラ", han: akaHan });
  if (uraHan > 0) doraYaku.push({ name: "裏ドラ", han: uraHan });

  const candidates: Candidate[] = [];

  // --- 標準形（4面子1雀頭） ---
  const interpretations = buildStandardInterpretations(
    concealedCounts,
    meldsNeeded,
    input.melds,
    winTileType,
    input.winType,
  );

  const yakuCtx = {
    isMenzen,
    winType: input.winType,
    riichi: input.riichi,
    seatWind: input.seatWind,
    roundWind: input.roundWind,
  };

  for (const interp of interpretations) {
    const fuDetail = calculateFuBreakdown(interp, yakuCtx, opts);
    const yakumanResults = detectYakuman(interp, { isMenzen }, concealedCounts);
    if (yakumanResults.length > 0) {
      candidates.push({
        yaku: yakumanResults,
        han: 13,
        fu: fuDetail.total,
        isYakuman: true,
        fuDetail,
      });
      continue; // 役満と通常役は複合させない
    }

    const regularYaku = detectStandardYaku(interp, yakuCtx);
    if (regularYaku.length === 0) continue; // 役なし（ドラのみ）は無効
    const yaku = [...regularYaku, ...doraYaku];
    const han = regularYaku.reduce((a, y) => a + y.han, 0) + bonusHan;
    candidates.push({ yaku, han, fu: fuDetail.total, isYakuman: false, fuDetail });
  }

  // --- 七対子・国士無双は副露が無い場合のみ ---
  if (input.melds.length === 0) {
    const kokushi = decomposeKokushi(concealedCounts);
    if (kokushi) {
      candidates.push({
        yaku: [{ name: "国士無双", han: 13 }],
        han: 13,
        fu: 0,
        isYakuman: true,
      });
    }

    const chiitoi = decomposeChiitoitsu(concealedCounts);
    if (chiitoi) {
      const pairTypes = chiitoi.pairs;
      if (pairTypes.every(isHonorType)) {
        candidates.push({
          yaku: [{ name: "字一色(七対子)", han: 13 }],
          han: 13,
          fu: 25,
          isYakuman: true,
        });
      }

      const chiitoiYaku: YakuResult[] = [{ name: "七対子", han: 2 }];
      if (isMenzen && input.winType === "tsumo") {
        chiitoiYaku.push({ name: "門前清自摸和", han: 1 });
      }
      if (input.riichi) chiitoiYaku.push({ name: "リーチ", han: 1 });
      if (pairTypes.every((t) => !isTerminalOrHonor(t))) {
        chiitoiYaku.push({ name: "断幺九", han: 1 });
      }
      const suitsUsed = new Set(
        pairTypes.filter((t) => !isHonorType(t)).map((t) => Math.floor(t / 9)),
      );
      const hasHonor = pairTypes.some(isHonorType);
      if (suitsUsed.size === 1) {
        chiitoiYaku.push(hasHonor ? { name: "混一色", han: 3 } : { name: "清一色", han: 6 });
      }
      const chiitoiHan = chiitoiYaku.reduce((a, y) => a + y.han, 0) + bonusHan;
      candidates.push({
        yaku: [...chiitoiYaku, ...doraYaku],
        han: chiitoiHan,
        fu: 25,
        isYakuman: false,
        fuDetail: chiitoitsuFuBreakdown(),
      });
    }
  }

  if (candidates.length === 0) return null;

  const scored = candidates.map((c) => ({
    candidate: c,
    result: buildCandidateResult(c, input.isDealer, input.winType),
  }));
  scored.sort((a, b) => paymentTotal(b.result.payment) - paymentTotal(a.result.payment));

  const best = scored[0].result;
  const runnerUp = scored.find(
    (s) => paymentTotal(s.result.payment) !== paymentTotal(best.payment),
  );

  if (runnerUp) {
    const diff = paymentTotal(best.payment) - paymentTotal(runnerUp.result.payment);
    best.interpretationNote = `別解: ${runnerUp.result.han}翻${runnerUp.result.fu}符 (${paymentTotal(runnerUp.result.payment)}点相当) という解釈も可能だが、高点法により此方（+${diff}点）を採用。`;
  }

  return best;
}

export type { StandardInterpretation };
