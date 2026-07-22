import { indicatorForDora } from "@/core/scoring/domain/doraService";
import type { Meld } from "@/core/scoring/domain/meld";
import type { Wind, WinType } from "@/core/scoring/domain/matchContext";
import { scoreHand, type ScoreHandInput } from "@/core/scoring/domain/scoreHandService";
import type { ScoreResult } from "@/core/scoring/domain/scoreService";
import {
  tileToType,
  tilesToCounts,
  type Tile,
  typeToTile,
  windToHonorType,
} from "@/core/scoring/domain/tile";
import { chance, pickOne, randomInt, type RandomSource } from "./random";

const WINDS: Wind[] = ["east", "south", "west", "north"];
/** SPEC.md の出題範囲: 場風は東・南のみ。 */
const ROUND_WINDS: Wind[] = ["east", "south"];
const SUIT_BASES = [0, 9, 18]; // m, p, s
/** 標準形の雀頭を自風牌に固定する確率（SPEC.md §4.1）。純ランダムでは約1/34しか
    出ず練習しにくいため、一定割合で意図的に「自風牌雀頭（役牌雀頭 +2符）」を作る。 */
const SEAT_WIND_PAIR_PROB = 1 / 15;

interface BuiltGroup {
  kind: "sequence" | "triplet";
  /** 3つの構成牌の型（triplet は同じ型が3回）。 */
  types: number[];
}

function tryAddSequence(counts: number[], rng: RandomSource): BuiltGroup | null {
  for (let attempt = 0; attempt < 20; attempt++) {
    const base = pickOne(SUIT_BASES, rng);
    const lo = base + randomInt(0, 6, rng); // 開始ランク1-7
    const types = [lo, lo + 1, lo + 2];
    if (types.every((t) => counts[t] < 4)) {
      for (const t of types) counts[t] += 1;
      return { kind: "sequence", types };
    }
  }
  return null;
}

function tryAddTriplet(counts: number[], rng: RandomSource): BuiltGroup | null {
  for (let attempt = 0; attempt < 20; attempt++) {
    const type = randomInt(0, 33, rng);
    if (counts[type] <= 1) {
      counts[type] += 3;
      return { kind: "triplet", types: [type, type, type] };
    }
  }
  return null;
}

/**
 * 雀頭の型を選ぶ。preferredType が渡され、まだ2枚以下しか使われていなければ
 * それを優先する（自風牌雀頭を意図的に増やすため。SPEC.md §4.1）。
 * 優先牌が使えない場合は従来どおりランダム抽出にフォールバックする。
 */
function tryAddPair(counts: number[], rng: RandomSource, preferredType?: number): number | null {
  if (preferredType !== undefined && counts[preferredType] <= 2) {
    counts[preferredType] += 2;
    return preferredType;
  }
  for (let attempt = 0; attempt < 20; attempt++) {
    const type = randomInt(0, 33, rng);
    if (counts[type] <= 2) {
      counts[type] += 2;
      return type;
    }
  }
  return null;
}

function buildRandomGroups(
  rng: RandomSource,
  preferredPairType?: number,
): { groups: BuiltGroup[]; pairType: number } | null {
  const counts = new Array(34).fill(0);
  const groups: BuiltGroup[] = [];
  for (let i = 0; i < 4; i++) {
    const wantSequence = chance(0.6, rng);
    const group =
      (wantSequence ? tryAddSequence(counts, rng) : tryAddTriplet(counts, rng)) ??
      (wantSequence ? tryAddTriplet(counts, rng) : tryAddSequence(counts, rng));
    if (!group) return null;
    groups.push(group);
  }
  const pairType = tryAddPair(counts, rng, preferredPairType);
  if (pairType === null) return null;
  return { groups, pairType };
}

type WinGroupRef = { kind: "set"; index: number } | { kind: "pair" };

function pickWinningGroup(setCount: number, rng: RandomSource): WinGroupRef {
  const idx = randomInt(0, setCount, rng); // setCount のとき「雀頭」を意味する
  return idx === setCount ? { kind: "pair" } : { kind: "set", index: idx };
}

type SetTransform = "concealed" | "chi" | "pon" | "minkan" | "ankan";

function pickTransform(kind: "sequence" | "triplet", rng: RandomSource): SetTransform {
  if (kind === "sequence") {
    return chance(0.25, rng) ? "chi" : "concealed";
  }
  const r = rng();
  if (r < 0.08) return "ankan";
  if (r < 0.18) return "minkan";
  if (r < 0.38) return "pon";
  return "concealed";
}

function groupToTiles(group: BuiltGroup): Tile[] {
  return group.types.map((t) => typeToTile(t));
}

export interface RandomHandResult {
  concealed: Tile[];
  melds: Meld[];
  winningTile: Tile;
  winType: WinType;
  seatWind: Wind;
  roundWind: Wind;
  isDealer: boolean;
  riichi: boolean;
  doraIndicators: Tile[];
  uraDoraIndicators: Tile[];
}

/** m/p/s の5にごく一部だけ赤フラグを付ける（各色最大1枚、現実の牌山に合わせる）。 */
function applyRedFive(concealed: Tile[], melds: Meld[], rng: RandomSource): void {
  for (const suit of ["m", "p", "s"] as const) {
    if (!chance(0.15, rng)) continue;
    const candidates = [
      ...concealed.filter((t) => t.suit === suit && t.rank === 5),
      ...melds.flatMap((m) => m.tiles).filter((t) => t.suit === suit && t.rank === 5),
    ];
    if (candidates.length === 0) continue;
    pickOne(candidates, rng).red = true;
  }
}

/** 手牌中の槓（明槓・暗槓）の数。ドラ表示牌の枚数決定に使う（SPEC.md §5.4）。 */
function countKans(melds: Meld[]): number {
  return melds.filter((m) => m.type === "minkan" || m.type === "ankan").length;
}

/**
 * リーチを許可してよい手か（問題生成ルール）。
 * 門前（副露が暗槓のみ）であり、かつ四槓子（槓が4つ）でないこと。
 * 四槓子は必ずリーチ無しとする。
 */
export function allowsRiichi(melds: Meld[]): boolean {
  const isMenzen = !melds.some((m) => m.type !== "ankan");
  return isMenzen && countKans(melds) < 4;
}

/**
 * ドラ表示牌をランダムに生成する。狙いの実際のドラ（時々手牌と一致させる）を決めてから
 * indicatorForDora で表示牌に変換する（学習用に「たまにドラが乗る」変化を持たせるため）。
 * 枚数は実戦準拠で「1＋槓の数」に固定する（SPEC.md §5.4）。
 */
function buildDoraIndicators(
  concealed: Tile[],
  melds: Meld[],
  riichi: boolean,
  rng: RandomSource,
): { doraIndicators: Tile[]; uraDoraIndicators: Tile[] } {
  const allHandTiles = [...concealed, ...melds.flatMap((m) => m.tiles)];
  // 実牌の使用枚数（手牌＋これまでに選んだ表示牌）。ドラ表示牌も牌山の実牌なので、
  // 表示牌を足しても同一牌が4枚を超えないようにする（SPEC.md §5.4）。
  const counts = tilesToCounts(allHandTiles);
  const pickIndicatorTile = (): Tile => {
    // 「たまにドラが手牌に乗る」変化を出しつつ、表示牌が4枚上限に達していたら選び直す。
    const attempt = (): Tile => {
      if (allHandTiles.length > 0 && chance(0.5, rng)) {
        const source = pickOne(allHandTiles, rng);
        return indicatorForDora({ suit: source.suit, rank: source.rank });
      }
      return indicatorForDora(typeToTile(randomInt(0, 33, rng)));
    };
    for (let i = 0; i < 20; i++) {
      const indicator = attempt();
      if (counts[tileToType(indicator)] < 4) {
        counts[tileToType(indicator)] += 1;
        return indicator;
      }
    }
    // 稀に上限で埋まった場合は、上限未満の牌を全型から探す（必ず存在する）。
    for (let type = 0; type < 34; type++) {
      if (counts[type] < 4) {
        counts[type] += 1;
        return typeToTile(type);
      }
    }
    // 理論上到達しない（手牌＋表示牌は牌総数より遥かに少ない）。
    return typeToTile(0);
  };
  // ドラ表示牌の枚数は「1＋槓の数」（基本1枚＋槓ごとに1枚めくられる槓ドラ表示牌。SPEC.md §5.4）。
  const indicatorCount = 1 + countKans(melds);
  const doraIndicators = Array.from({ length: indicatorCount }, pickIndicatorTile);
  const uraDoraIndicators = riichi
    ? Array.from({ length: indicatorCount }, pickIndicatorTile)
    : [];
  return { doraIndicators, uraDoraIndicators };
}

function pickConditions(rng: RandomSource): {
  seatWind: Wind;
  roundWind: Wind;
  isDealer: boolean;
  winType: WinType;
} {
  const seatWind = pickOne(WINDS, rng);
  const roundWind = pickOne(ROUND_WINDS, rng);
  // 自風が東の家が常に親（現実の局進行と整合させる）。
  const isDealer = seatWind === "east";
  const winType: WinType = chance(0.5, rng) ? "tsumo" : "ron";
  return { seatWind, roundWind, isDealer, winType };
}

/** 4面子1雀頭の標準形をランダムに1つ構築する。構築不能なら null。 */
function buildRandomStandardHand(rng: RandomSource): RandomHandResult | null {
  const { seatWind, roundWind, isDealer, winType } = pickConditions(rng);
  // 一定確率で雀頭を自風牌に固定する（自風牌雀頭＝役牌雀頭 +2符。SPEC.md §4.1）。
  // 占有済み等で使えない場合は buildRandomGroups 内でランダム抽出にフォールバックする。
  const preferredPairType = chance(SEAT_WIND_PAIR_PROB, rng)
    ? windToHonorType(seatWind)
    : undefined;
  const built = buildRandomGroups(rng, preferredPairType);
  if (!built) return null;
  const { groups, pairType } = built;

  const winGroupRef = pickWinningGroup(groups.length, rng);
  const winTileType =
    winGroupRef.kind === "pair" ? pairType : pickOne(groups[winGroupRef.index].types, rng);
  const winningTile = typeToTile(winTileType);

  const melds: Meld[] = [];
  const concealedTiles: Tile[] = [];

  groups.forEach((group, index) => {
    const isWinningSet = winGroupRef.kind === "set" && winGroupRef.index === index;
    if (isWinningSet) {
      concealedTiles.push(...groupToTiles(group));
      return;
    }
    const transform = pickTransform(group.kind, rng);
    if (transform === "concealed") {
      concealedTiles.push(...groupToTiles(group));
    } else if (transform === "chi") {
      const tiles = groupToTiles(group);
      melds.push({ type: "chi", tiles });
    } else if (transform === "pon") {
      const tiles = groupToTiles(group);
      melds.push({ type: "pon", tiles });
    } else {
      // minkan / ankan: 4枚目を追加する
      const tileType = group.types[0];
      const tiles = [...groupToTiles(group), typeToTile(tileType)];
      if (transform === "minkan") {
        melds.push({ type: "minkan", tiles });
      } else {
        melds.push({ type: "ankan", tiles });
      }
    }
  });

  const concealed = [...concealedTiles, typeToTile(pairType), typeToTile(pairType)];
  // 四槓子は必ずリーチ無し（allowsRiichi 内で判定）。
  const riichi = allowsRiichi(melds) && chance(0.5, rng);

  applyRedFive(concealed, melds, rng);
  const { doraIndicators, uraDoraIndicators } = buildDoraIndicators(concealed, melds, riichi, rng);

  return {
    concealed,
    melds,
    winningTile,
    winType,
    seatWind,
    roundWind,
    isDealer,
    riichi,
    doraIndicators,
    uraDoraIndicators,
  };
}

/** 七対子形をランダムに1つ構築する。 */
function buildRandomChiitoiHand(rng: RandomSource): RandomHandResult | null {
  const used = new Set<number>();
  const types: number[] = [];
  for (let i = 0; i < 7; i++) {
    let picked = -1;
    for (let attempt = 0; attempt < 30; attempt++) {
      const candidate = randomInt(0, 33, rng);
      if (!used.has(candidate)) {
        picked = candidate;
        break;
      }
    }
    if (picked === -1) return null;
    used.add(picked);
    types.push(picked);
  }

  const winTileType = pickOne(types, rng);
  const winningTile = typeToTile(winTileType);
  const concealed = types.flatMap((t) => [typeToTile(t), typeToTile(t)]);
  const { seatWind, roundWind, isDealer, winType } = pickConditions(rng);
  const riichi = chance(0.5, rng); // 七対子は常に門前

  applyRedFive(concealed, [], rng);
  const { doraIndicators, uraDoraIndicators } = buildDoraIndicators(concealed, [], riichi, rng);

  return {
    concealed,
    melds: [],
    winningTile,
    winType,
    seatWind,
    roundWind,
    isDealer,
    riichi,
    doraIndicators,
    uraDoraIndicators,
  };
}

export interface GeneratedHand extends RandomHandResult {
  answer: ScoreResult;
}

const MAX_ATTEMPTS = 200;

/**
 * 同一牌が5枚以上使われていないか（牌は各4枚までのため。SPEC.md §4.1・§5.4）。
 * 槓が既存の順子・刻子・雀頭と同じ牌を占有した場合や、ドラ/裏ドラ表示牌が手牌の牌と
 * 衝突して4枚を超える場合に起こり得る不正な手を検出する。表示牌も牌山の実牌なので、
 * 手牌＋表ドラ＋裏ドラ表示牌の総数で判定する。
 */
function isTileCountValid(
  concealed: Tile[],
  melds: Meld[],
  doraIndicators: Tile[] = [],
  uraDoraIndicators: Tile[] = [],
): boolean {
  const counts = tilesToCounts([
    ...concealed,
    ...melds.flatMap((m) => m.tiles),
    ...doraIndicators,
    ...uraDoraIndicators,
  ]);
  return counts.every((count) => count <= 4);
}

/**
 * ランダムな和了形を生成し、点数計算エンジンで採点する。
 * 役が一つも成立しない手、または同一牌が5枚以上になる不正な手は破棄して
 * 最大MAX_ATTEMPTS回までリトライする。
 */
export function generateRandomHand(rng: RandomSource = Math.random): GeneratedHand | null {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const useChiitoi = chance(0.12, rng);
    const built = useChiitoi ? buildRandomChiitoiHand(rng) : buildRandomStandardHand(rng);
    if (!built) continue;
    if (
      !isTileCountValid(
        built.concealed,
        built.melds,
        built.doraIndicators,
        built.uraDoraIndicators,
      )
    )
      continue;

    const input: ScoreHandInput = {
      concealed: built.concealed,
      melds: built.melds,
      winningTile: built.winningTile,
      winType: built.winType,
      doraIndicators: built.doraIndicators,
      uraDoraIndicators: built.uraDoraIndicators,
      seatWind: built.seatWind,
      roundWind: built.roundWind,
      isDealer: built.isDealer,
      riichi: built.riichi,
    };
    const answer = scoreHand(input);
    if (!answer) continue; // 役なし -> リトライ

    return { ...built, answer };
  }
  return null;
}
