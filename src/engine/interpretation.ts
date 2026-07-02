import type { Meld, WinType } from "./model";
import type { StandardDecomposition } from "./decompose";
import { decomposeStandard } from "./decompose";
import { tileToType } from "./tileType";

export type WaitKind = "ryanmen" | "kanchan" | "penchan" | "shanpon" | "tanki";

export interface HandSet {
  kind: "sequence" | "triplet";
  /** triplet: その型。sequence: 最小の型。 */
  tileType: number;
  /** 副露（チー/ポン/明槓）でなければ true。暗槓も true。 */
  concealed: boolean;
  isKan: boolean;
  isWinningGroup: boolean;
  waitKind?: WaitKind;
}

export interface HandPair {
  tileType: number;
  isWinningGroup: boolean;
}

/** 4面子1雀頭形の1つの具体的な解釈（分解＋どの面子が上がり牌を完成させたか）。 */
export interface StandardInterpretation {
  kind: "standard";
  sets: HandSet[];
  pair: HandPair;
}

function meldToHandSet(meld: Meld): HandSet {
  const isKan = meld.type === "minkan" || meld.type === "ankan";
  const kind: "sequence" | "triplet" = meld.type === "chi" ? "sequence" : "triplet";
  const sortedTypes = meld.tiles.map(tileToType).sort((a, b) => a - b);
  const tileType = sortedTypes[0];
  return {
    kind,
    tileType,
    concealed: meld.type === "ankan",
    isKan,
    isWinningGroup: false,
  };
}

/** 順子内で上がり牌がどの位置かに基づき待ちの種類を判定する。 */
function sequenceWaitKind(seqLowType: number, winType: number): WaitKind {
  const rankInSuit = seqLowType % 9; // 0-indexed rank of the lowest tile (0=rank1)
  const position = winType - seqLowType; // 0=lowest, 1=middle, 2=highest
  if (position === 1) return "kanchan";
  if (position === 0) {
    // 上がり牌が最小: 手前は (t+1,t+2)。t+1,t+2が「8,9」相当なら辺張。
    return rankInSuit === 6 ? "penchan" : "ryanmen"; // rankInSuit=6 -> ranks (7,8,9)
  }
  // position === 2: 上がり牌が最大。手前は(t,t+1)。t,t+1が「1,2」相当なら辺張。
  return rankInSuit === 0 ? "penchan" : "ryanmen";
}

interface WinCandidate {
  groupRef: "set" | "pair";
  index: number;
  waitKind: WaitKind;
}

function findWinCandidates(
  decomposition: StandardDecomposition,
  winTileType: number,
): WinCandidate[] {
  const candidates: WinCandidate[] = [];

  decomposition.sets.forEach((set, index) => {
    if (set.kind === "triplet") {
      if (set.tileType === winTileType) {
        candidates.push({ groupRef: "set", index, waitKind: "shanpon" });
      }
    } else {
      const lo = set.tileType;
      if (winTileType >= lo && winTileType <= lo + 2) {
        candidates.push({
          groupRef: "set",
          index,
          waitKind: sequenceWaitKind(lo, winTileType),
        });
      }
    }
  });

  if (decomposition.pairType === winTileType) {
    candidates.push({ groupRef: "pair", index: 0, waitKind: "tanki" });
  }

  return candidates;
}

/**
 * 手牌全体（副露＋純手牌の分解）から、あり得る全ての具体的解釈を列挙する。
 * 高点法で最終的に最高得点の解釈を選ぶための材料。
 */
export function buildStandardInterpretations(
  concealedCounts: readonly number[],
  meldsNeeded: number,
  fixedMelds: readonly Meld[],
  winTileType: number,
  winType: WinType,
): StandardInterpretation[] {
  const decompositions = decomposeStandard(concealedCounts, meldsNeeded);
  const fixedHandSets = fixedMelds.map(meldToHandSet);
  const interpretations: StandardInterpretation[] = [];

  for (const decomposition of decompositions) {
    const candidates = findWinCandidates(decomposition, winTileType);
    for (const candidate of candidates) {
      const concealedSets: HandSet[] = decomposition.sets.map((s, i) => {
        const isWinningGroup = candidate.groupRef === "set" && candidate.index === i;
        const isRonCompletedTriplet =
          isWinningGroup && s.kind === "triplet" && winType === "ron";
        return {
          kind: s.kind,
          tileType: s.tileType,
          concealed: !isRonCompletedTriplet,
          isKan: false,
          isWinningGroup,
          waitKind: isWinningGroup ? candidate.waitKind : undefined,
        };
      });

      const pair: HandPair = {
        tileType: decomposition.pairType,
        isWinningGroup: candidate.groupRef === "pair",
      };

      interpretations.push({
        kind: "standard",
        sets: [...fixedHandSets, ...concealedSets],
        pair,
      });
    }
  }

  return interpretations;
}
