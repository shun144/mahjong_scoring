import { shuffle, type RandomSource } from "./random";

const CHOICE_COUNT = 4;

/** 上がり方: 門前ロン=10 / ツモ=2 / 鳴きロン=0（固定選択肢。SPEC.md §4.10）。 */
export const WIN_METHOD_CHOICES = [0, 2, 10] as const;
/** 雀頭: 役牌=2 / それ以外=0（固定選択肢）。 */
export const PAIR_CHOICES = [0, 2] as const;
/** 待ち: 嵌張・辺張・単騎=2 / 両面・双碰=0（固定選択肢）。 */
export const WAIT_CHOICES = [0, 2] as const;
/** 固定符手（平和ツモ20・七対子25）の選択肢。30は混同しやすい値として誤答に充てる。 */
export const FIXED_FU_CHOICES = [20, 25, 30] as const;

/** 面子の符合計の妥当な値プール（誤答の補完に使う）。 */
const MELD_TOTAL_POOL = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64];

/**
 * 面子の符合計（4面子ぶんの合計）の4択を生成する（SPEC.md §4.10）。
 * 正解の近傍（±2/±4/±8）を優先し、足りない分は妥当な符プールから補完する。
 * 誤答の選定はランダムだが、最後に昇順で返す（他の要素行の固定選択肢と表示を統一）。
 */
export function generateMeldTotalChoices(correct: number, rng: RandomSource): number[] {
  const seen = new Set<number>([correct]);
  const distractors: number[] = [];

  for (const delta of [2, -2, 4, -4, 8, -8]) {
    const value = correct + delta;
    if (value < 0 || seen.has(value)) continue;
    seen.add(value);
    distractors.push(value);
  }

  for (const value of MELD_TOTAL_POOL) {
    if (distractors.length >= CHOICE_COUNT - 1) break;
    if (seen.has(value)) continue;
    seen.add(value);
    distractors.push(value);
  }

  const shuffledDistractors = shuffle(distractors, rng).slice(0, CHOICE_COUNT - 1);
  return [correct, ...shuffledDistractors].sort((a, b) => a - b);
}
