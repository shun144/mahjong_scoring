import type { WinType } from "../engine/model";
import { calculatePayment, type Payment } from "../engine/score";
import { randomInt, shuffle, type RandomSource } from "./random";

export interface DistractorContext {
  han: number;
  fu: number;
  isDealer: boolean;
  winType: WinType;
}

/** Payment を比較・重複排除用のキー文字列にする。UI側の正誤判定にも使う。 */
export function paymentKey(payment: Payment): string {
  if (payment.kind === "ron") return `ron:${payment.total}`;
  if (payment.kind === "tsumo-oya") return `tsumo-oya:${payment.each}`;
  return `tsumo-ko:${payment.nonDealer}:${payment.dealer}`;
}

/** Payment から代表額を1つ取り出す（tsumo-ko は子の取り分を代表値とする）。 */
function representativeAmount(payment: Payment): number {
  if (payment.kind === "ron") return payment.total;
  if (payment.kind === "tsumo-oya") return payment.each;
  return payment.nonDealer;
}

/**
 * 代表額を指定の支払い形式に組み直す。
 * tsumo-ko は実在の支払い表と同じく「親は子の2倍」の関係を保つため、
 * 見た目は自然だが数値としては誤っている選択肢になる。
 */
function reformatAs(kind: Payment["kind"], amount: number): Payment {
  if (kind === "ron") return { kind: "ron", total: amount };
  if (kind === "tsumo-oya") return { kind: "tsumo-oya", each: amount };
  return { kind: "tsumo-ko", nonDealer: amount, dealer: amount * 2 };
}

/**
 * ありがちな誤りのパターンから誤答候補（Payment、正解と同じ支払い形式）を生成する（SPEC.md §7）。
 * 「符の切り上げ忘れ」は、採点内部の丸め前の値を保持していないため、
 * 一つ低い符ブラケット（-10符）で計算し直すことで近似する。
 * 「親子取り違え」「ツモ/ロン取り違え」は、誤った条件での計算結果を代表額として取り出し、
 * 正解と同じ表示形式（ron / tsumo-ko / tsumo-oya）に組み直す。
 */
function buildCandidatePool(ctx: DistractorContext, correctKind: Payment["kind"]): Payment[] {
  const pool: Payment[] = [];
  const add = (han: number, fu: number, isDealer: boolean, winType: WinType) => {
    if (han < 1) return;
    const payment = calculatePayment(han, fu, isDealer, winType).payment;
    pool.push(reformatAs(correctKind, representativeAmount(payment)));
  };

  const fuIsFixed = ctx.fu === 25; // 七対子は符固定のためブラケットのずれを模擬しない

  // 符の切り上げ忘れ（一つ低いブラケット）/ 符の数え過ぎ（一つ高いブラケット）
  if (!fuIsFixed) {
    if (ctx.fu > 20) add(ctx.han, ctx.fu - 10, ctx.isDealer, ctx.winType);
    add(ctx.han, ctx.fu + 10, ctx.isDealer, ctx.winType);
  }

  // 翻の数え間違い（役の見落とし・ドラの数え違いを包含する）
  add(ctx.han - 1, ctx.fu, ctx.isDealer, ctx.winType);
  add(ctx.han + 1, ctx.fu, ctx.isDealer, ctx.winType);
  add(ctx.han - 2, ctx.fu, ctx.isDealer, ctx.winType);
  add(ctx.han + 2, ctx.fu, ctx.isDealer, ctx.winType);

  // 親子の取り違え
  add(ctx.han, ctx.fu, !ctx.isDealer, ctx.winType);

  // ツモ/ロンの取り違え（同じ手を別の和了形式で計算した額を代表値として流用）
  const otherWinType: WinType = ctx.winType === "ron" ? "tsumo" : "ron";
  add(ctx.han, ctx.fu, ctx.isDealer, otherWinType);
  add(ctx.han, ctx.fu, !ctx.isDealer, otherWinType);

  return pool;
}

const MIN_CHOICES = 4;
const MAX_CHOICES = 8;

/**
 * 正解を含む4〜8択の選択肢（シャッフル済み）を生成する。
 * 全ての候補は正解と同じ支払い形式（ron / tsumo-ko / tsumo-oya）に揃える。
 */
export function generateChoices(
  correctPayment: Payment,
  ctx: DistractorContext,
  rng: RandomSource,
): Payment[] {
  const pool = buildCandidatePool(ctx, correctPayment.kind);

  const seen = new Set<string>([paymentKey(correctPayment)]);
  const distractors: Payment[] = [];
  for (const candidate of pool) {
    const key = paymentKey(candidate);
    if (seen.has(key)) continue;
    seen.add(key);
    distractors.push(candidate);
  }

  const maxPossible = Math.min(MAX_CHOICES, distractors.length + 1);
  const targetTotal = maxPossible <= MIN_CHOICES ? maxPossible : randomInt(MIN_CHOICES, maxPossible, rng);
  const shuffledDistractors = shuffle(distractors, rng).slice(0, targetTotal - 1);

  return shuffle([correctPayment, ...shuffledDistractors], rng);
}
