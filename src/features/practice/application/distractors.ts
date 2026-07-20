import type { FuBreakdown } from "@/engine/fu";
import type { WinType } from "@/engine/model";
import { calculatePayment, type Payment } from "@/engine/score";
import { shuffle, type RandomSource } from "./random";

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
 * tsumo-ko は実在の支払い表と同じく「親は子の2倍」の関係を保つ。
 * 別条件由来の代表額を流用すると採点上あり得ない額になり得るが、
 * generateChoices 側で実在点数のみに絞り込むため、非実在の額は選択肢に残らない。
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

const CHOICE_COUNT = 4;

/** 誤答検証・補完に使う探索範囲（1〜13翻＝数え役満まで）。 */
const DISTRACTOR_HAN_RANGE = Array.from({ length: 13 }, (_, i) => i + 1);
/** ロンで実在する符（20符ロンは無い。25符は七対子）。 */
const RON_FU_LIST = [25, 30, 40, 50, 60, 70, 80, 90, 100, 110];
/** ツモで実在する符（20符ツモは平和ツモ等で有り得る）。 */
const TSUMO_FU_LIST = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110];

/** 正解と同じ表示形式（kind）に対応する計算条件と探索する符の一覧を返す。 */
function realConfigForKind(
  kind: Payment["kind"],
  ctxIsDealer: boolean,
): { isDealer: boolean; winType: WinType; fuList: number[] } {
  if (kind === "ron") return { isDealer: ctxIsDealer, winType: "ron", fuList: RON_FU_LIST };
  if (kind === "tsumo-oya") return { isDealer: true, winType: "tsumo", fuList: TSUMO_FU_LIST };
  return { isDealer: false, winType: "tsumo", fuList: TSUMO_FU_LIST };
}

/**
 * 正解と同じ表示形式で「実在する」点数の一覧（キー重複排除済み）を列挙する。
 * 翻×符の全組み合わせを実際に採点して得られる値のみなので、
 * ここに無い点数（例: ロンの点をツモ表記に流用した値）は実在しない誤答として除外できる。
 */
function realPaymentsForKind(kind: Payment["kind"], ctxIsDealer: boolean): Payment[] {
  const { isDealer, winType, fuList } = realConfigForKind(kind, ctxIsDealer);
  const byKey = new Map<string, Payment>();
  for (const han of DISTRACTOR_HAN_RANGE) {
    for (const fu of fuList) {
      const { payment } = calculatePayment(han, fu, isDealer, winType);
      byKey.set(paymentKey(payment), payment);
    }
  }
  return [...byKey.values()];
}

/**
 * 正解を含む4択の選択肢（シャッフル済み）を生成する。
 * 全ての候補は正解と同じ支払い形式（ron / tsumo-ko / tsumo-oya）に揃える。
 * **実在しない点数は選択肢に含めない**（ありがちな誤りパターンでも、採点上あり得ない額は除外し、
 * 不足分は正解額に近い実在点数で補完する）。
 */
export function generateChoices(
  correctPayment: Payment,
  ctx: DistractorContext,
  rng: RandomSource,
): Payment[] {
  const realPayments = realPaymentsForKind(correctPayment.kind, ctx.isDealer);
  const realKeys = new Set(realPayments.map(paymentKey));

  const seen = new Set<string>([paymentKey(correctPayment)]);
  const distractors: Payment[] = [];

  // 1) ありがちな誤りパターンのうち、実在する点数だけを誤答として採用する。
  for (const candidate of buildCandidatePool(ctx, correctPayment.kind)) {
    const key = paymentKey(candidate);
    if (seen.has(key) || !realKeys.has(key)) continue;
    seen.add(key);
    distractors.push(candidate);
  }

  // 2) 誤答が足りない場合は、正解額に近い実在点数で補完する（すべて実在・同一表示形式）。
  if (distractors.length < CHOICE_COUNT - 1) {
    const correctAmount = representativeAmount(correctPayment);
    const backfill = realPayments
      .filter((p) => !seen.has(paymentKey(p)))
      .sort(
        (a, b) =>
          Math.abs(representativeAmount(a) - correctAmount) -
          Math.abs(representativeAmount(b) - correctAmount),
      );
    for (const p of backfill) {
      if (distractors.length >= CHOICE_COUNT - 1) break;
      seen.add(paymentKey(p));
      distractors.push(p);
    }
  }

  const shuffledDistractors = shuffle(distractors, rng).slice(0, CHOICE_COUNT - 1);

  return shuffle([correctPayment, ...shuffledDistractors], rng);
}

/** 符計算モードで妥当な符の値（誤答の補完に使う）。 */
const FU_POOL = [20, 25, 30, 40, 50, 60, 70];

/**
 * 符計算モードの誤答候補を、正解の符内訳から生成する（SPEC.md §7）。
 * - 切り上げ忘れ（subtotal そのまま）
 * - 1段階のずれ（±10符）
 * - 待ち符・ツモ符の付け忘れ/数え過ぎ（±2符の近似）
 * 固定符（七対子25・平和20）は ±10 系を避け、混同しやすい他符（FU_POOL）で補う。
 */
function buildFuCandidatePool(detail: FuBreakdown): number[] {
  const { total, subtotal, fixed } = detail;
  const pool: number[] = [];

  if (!fixed) {
    // 切り上げ忘れ（丸め前の値が丸め後と異なる場合）
    if (subtotal !== total) pool.push(subtotal);
    // 1段階のずれ
    if (total - 10 >= 20) pool.push(total - 10);
    pool.push(total + 10);
    // 待ち符・ツモ符の付け忘れ/数え過ぎ（切り上げ前後に効く近似）
    pool.push(Math.ceil((subtotal - 2) / 10) * 10);
    pool.push(Math.ceil((subtotal + 2) / 10) * 10);
  }

  // 妥当な符プールで補完（固定符ケースの主たる誤答源でもある）
  pool.push(...FU_POOL);

  return pool.filter((fu) => fu >= 20);
}

/**
 * 正解の符を含む4択（シャッフル済み）を生成する。
 * 誤答候補が足りない稀なケースでは4択未満に縮退する。
 */
export function generateFuChoices(detail: FuBreakdown, rng: RandomSource): number[] {
  const correct = detail.total;
  const pool = buildFuCandidatePool(detail);

  const seen = new Set<number>([correct]);
  const distractors: number[] = [];
  for (const candidate of pool) {
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    distractors.push(candidate);
  }

  const shuffledDistractors = shuffle(distractors, rng).slice(0, CHOICE_COUNT - 1);

  return shuffle([correct, ...shuffledDistractors], rng);
}
