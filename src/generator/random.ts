/** 0以上1未満の乱数を返す関数。テストではシード付きの実装を注入できる。 */
export type RandomSource = () => number;

export function pickOne<T>(arr: readonly T[], rng: RandomSource): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** min以上max以下（両端含む）の整数を返す。 */
export function randomInt(min: number, max: number, rng: RandomSource): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function chance(probability: number, rng: RandomSource): boolean {
  return rng() < probability;
}

/** Fisher-Yatesで配列をシャッフルしたコピーを返す（元配列は変更しない）。 */
export function shuffle<T>(arr: readonly T[], rng: RandomSource): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** [0,1)の疑似乱数を返す決定的なシード付きRNG（テスト用）。 */
export function createSeededRandom(seed: number): RandomSource {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}
