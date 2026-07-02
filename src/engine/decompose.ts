/**
 * 和了形の分解（4面子1雀頭 / 七対子 / 国士無双）。
 * 型インデックス(0-33)の枚数配列を入力とし、あり得る全ての分解を列挙する
 * （高点法での比較や待ちの判定に複数解釈が必要なため）。
 */

export interface DecomposedSet {
  kind: "sequence" | "triplet";
  /** triplet: その型。sequence: 最小の型（例: 234mなら"2m"の型）。 */
  tileType: number;
}

export interface StandardDecomposition {
  sets: DecomposedSet[];
  pairType: number;
}

/**
 * counts（34型の枚数配列）を setsNeeded 個の面子 + 雀頭1つに分解する
 * 全パターンを返す（順子・刻子の解釈が複数あり得るため重複なく列挙）。
 */
export function decomposeStandard(
  counts: readonly number[],
  setsNeeded: number,
): StandardDecomposition[] {
  const working = [...counts];
  const results: StandardDecomposition[] = [];

  function firstNonzero(): number {
    return working.findIndex((c) => c > 0);
  }

  function backtrack(setsUsed: DecomposedSet[], pairType: number | null) {
    const idx = firstNonzero();
    if (idx === -1) {
      if (setsUsed.length === setsNeeded && pairType !== null) {
        results.push({ sets: [...setsUsed], pairType });
      }
      return;
    }

    // 雀頭として使う
    if (pairType === null && working[idx] >= 2) {
      working[idx] -= 2;
      backtrack(setsUsed, idx);
      working[idx] += 2;
    }

    // 刻子として使う
    if (setsUsed.length < setsNeeded && working[idx] >= 3) {
      working[idx] -= 3;
      setsUsed.push({ kind: "triplet", tileType: idx });
      backtrack(setsUsed, pairType);
      setsUsed.pop();
      working[idx] += 3;
    }

    // 順子として使う（数牌のみ、かつ idx が 7,8,9番目でないこと）
    if (setsUsed.length < setsNeeded && idx < 27) {
      const rankInSuit = idx % 9; // 0-8 (0=1, 8=9)
      if (rankInSuit <= 6) {
        const i2 = idx + 1;
        const i3 = idx + 2;
        if (working[idx] >= 1 && working[i2] >= 1 && working[i3] >= 1) {
          working[idx] -= 1;
          working[i2] -= 1;
          working[i3] -= 1;
          setsUsed.push({ kind: "sequence", tileType: idx });
          backtrack(setsUsed, pairType);
          setsUsed.pop();
          working[idx] += 1;
          working[i2] += 1;
          working[i3] += 1;
        }
      }
    }
  }

  backtrack([], null);
  return dedupeDecompositions(results);
}

function decompositionKey(d: StandardDecomposition): string {
  const setsKey = [...d.sets]
    .sort((a, b) => (a.kind === b.kind ? a.tileType - b.tileType : a.kind.localeCompare(b.kind)))
    .map((s) => `${s.kind[0]}${s.tileType}`)
    .join(",");
  return `${setsKey}|${d.pairType}`;
}

function dedupeDecompositions(decs: StandardDecomposition[]): StandardDecomposition[] {
  const seen = new Map<string, StandardDecomposition>();
  for (const d of decs) {
    seen.set(decompositionKey(d), d);
  }
  return [...seen.values()];
}

/** 国士無双で使える13種の型（老頭牌+字牌）。 */
export const KOKUSHI_TYPES: readonly number[] = [
  0, 8, // 1m 9m
  9, 17, // 1p 9p
  18, 26, // 1s 9s
  27, 28, 29, 30, 31, 32, 33, // 東南西北白發中
];

export interface ChiitoitsuDecomposition {
  pairs: number[]; // 7つの型
}

/** 七対子として成立するか判定する（7種の型がそれぞれ2枚ずつ）。 */
export function decomposeChiitoitsu(
  counts: readonly number[],
): ChiitoitsuDecomposition | null {
  const pairs: number[] = [];
  for (let i = 0; i < 34; i++) {
    const c = counts[i];
    if (c === 0) continue;
    if (c !== 2) return null;
    pairs.push(i);
  }
  if (pairs.length !== 7) return null;
  return { pairs };
}

export interface KokushiDecomposition {
  types: readonly number[];
  pairType: number;
}

/** 国士無双として成立するか判定する。 */
export function decomposeKokushi(
  counts: readonly number[],
): KokushiDecomposition | null {
  let pairType: number | null = null;
  for (let i = 0; i < 34; i++) {
    const c = counts[i];
    if (c === 0) continue;
    if (!KOKUSHI_TYPES.includes(i)) return null;
    if (c === 1) continue;
    if (c === 2 && pairType === null) {
      pairType = i;
      continue;
    }
    return null;
  }
  if (pairType === null) return null;
  for (const t of KOKUSHI_TYPES) {
    if (counts[t] === 0) return null;
  }
  return { types: KOKUSHI_TYPES, pairType };
}
