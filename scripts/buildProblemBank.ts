/**
 * 検証済み問題バンクの生成スクリプト。
 *
 * 手牌を人が読みやすいコンパクト記法で定義し、実際の点数計算エンジン(scoreHand)に
 * かけて得た結果を「正解」として採用する。バンクの正解は常にエンジンの出力そのもの
 * なので、エンジンとバンクが乖離することはなく、将来の回帰テストのフィクスチャにもなる。
 *
 * 実行: npx vite-node scripts/buildProblemBank.ts
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { indicatorForDora } from "../src/engine/dora";
import type { Meld, MeldType, Tile, Wind, WinType } from "../src/engine/model";
import { scoreHand, type ScoreHandInput } from "../src/engine/scoreHand";
import { parseTileNotation } from "../src/engine/tiles";
import { tileToType, typeToTile } from "../src/engine/tileType";
import type { Problem } from "../src/data/problem";

const __dirname = dirname(fileURLToPath(import.meta.url));

function notationsToTiles(compact: string): Tile[] {
  const parts = compact.match(/\d+[mpsz]/g) ?? [];
  const out: Tile[] = [];
  for (const part of parts) {
    const suit = part[part.length - 1];
    for (const digit of part.slice(0, -1)) out.push(parseTileNotation(`${digit}${suit}`));
  }
  return out;
}

interface MeldSpec {
  type: MeldType;
  /** 個々の牌記法（例: ["3s","3s","3s"]）。 */
  tiles: string[];
  /** 鳴いた牌のインデックス（chi/pon/minkanで指定。ankanは不要）。 */
  calledIndex?: number;
}

function buildMeld(spec: MeldSpec): Meld {
  const tiles = spec.tiles.map(parseTileNotation);
  const calledTile = spec.calledIndex !== undefined ? tiles[spec.calledIndex] : undefined;
  return { type: spec.type, tiles, calledTile };
}

interface HandSpec {
  id: string;
  label: string;
  concealed: string;
  melds?: MeldSpec[];
  winningTile: string;
  winType: WinType;
  /** 実際に狙うドラ（表示牌はここから自動で逆算する）。 */
  dora?: string[];
  /** 実際に狙う裏ドラ（表示牌はここから自動で逆算する）。 */
  uraDora?: string[];
  seatWind?: Wind;
  roundWind?: Wind;
  riichi?: boolean;
}

/** 槓（明槓・暗槓）の数。ドラ表示牌の枚数決定に使う（SPEC.md §5.4: 枚数=1+槓の数）。 */
function countKans(melds: MeldSpec[]): number {
  return melds.filter((m) => m.type === "minkan" || m.type === "ankan").length;
}

/**
 * ドラ表示牌を明示しない問題に対し、手牌に「乗らない」ドラ（＝手牌に無い牌をドラとする）
 * の表示牌を count 枚与える。麻雀ルール上ドラ表示牌の枚数は「1＋槓の数」であるため
 * （SPEC.md §5.4）、手牌に含まれないドラを選ぶことで、既存問題の正解（符・翻・役）を
 * 一切変えずに正しい枚数へ揃える。
 */
function nonLandingDoraIndicators(handTiles: Tile[], count: number): Tile[] {
  const handTypes = new Set(handTiles.map(tileToType));
  const nonLandingTypes: number[] = [];
  for (let type = 0; type < 34; type++) {
    if (!handTypes.has(type)) nonLandingTypes.push(type);
  }
  return Array.from({ length: count }, (_, i) => {
    // 非当たり牌が足りない（現実にはあり得ない）場合は循環させて保険とする。
    const type = nonLandingTypes[i % Math.max(nonLandingTypes.length, 1)] ?? 0;
    return indicatorForDora(typeToTile(type));
  });
}

function toScoreHandInput(spec: HandSpec): ScoreHandInput {
  const concealed = notationsToTiles(spec.concealed);
  const meldSpecs = spec.melds ?? [];
  const melds = meldSpecs.map(buildMeld);
  const explicitDora = (spec.dora ?? []).map(parseTileNotation).map(indicatorForDora);
  const explicitUra = (spec.uraDora ?? []).map(parseTileNotation).map(indicatorForDora);
  const allHandTiles = [...concealed, ...melds.flatMap((m) => m.tiles)];
  const riichi = spec.riichi ?? false;
  // ドラ表示牌の枚数は「1＋槓の数」（SPEC.md §5.4）。未指定なら手牌に乗らないドラで揃える。
  const indicatorCount = 1 + countKans(meldSpecs);
  const doraIndicators =
    explicitDora.length > 0 ? explicitDora : nonLandingDoraIndicators(allHandTiles, indicatorCount);
  // 裏ドラ表示牌はリーチ時のみ、その場合も表と同数（SPEC.md §5.4）。未指定なら乗らない裏ドラで揃える。
  const uraDoraIndicators = !riichi
    ? []
    : explicitUra.length > 0
      ? explicitUra
      : nonLandingDoraIndicators(allHandTiles, indicatorCount);
  // 既定の自風は「子」の風(南)にする。東は親専用のため既定にしない。
  const seatWind = spec.seatWind ?? "south";
  return {
    concealed,
    melds,
    winningTile: parseTileNotation(spec.winningTile),
    winType: spec.winType,
    doraIndicators,
    uraDoraIndicators,
    seatWind,
    roundWind: spec.roundWind ?? "east",
    // 東家＝親（自風=東 ⟺ 親。生成器 pickConditions と同じルール）。
    isDealer: seatWind === "east",
    riichi,
  };
}

// ---------------------------------------------------------------------------
// 問題定義: 門前/鳴き・七対子・役満・赤/裏ドラ・高点法・様々な符/役を幅広くカバーする。
// ---------------------------------------------------------------------------
const specs: HandSpec[] = [
  // --- リーチ・平和・断幺九など基本役 ---
  {
    id: "riichi-pinfu-ryanmen-ron",
    label: "リーチのみ 平和ロン(30符)",
    concealed: "234m567p33z345s789m",
    winningTile: "9m",
    winType: "ron",
    riichi: true,
  },
  {
    id: "pinfu-tsumo-20fu",
    label: "平和ツモ(20符固定)",
    concealed: "234m567p33z345s789m",
    winningTile: "9m",
    winType: "tsumo",
  },
  {
    id: "tanyao-tsumo",
    label: "断幺九 門前清自摸和",
    concealed: "234m345p456s33s678m",
    winningTile: "8m",
    winType: "tsumo",
  },
  {
    id: "tanyao-dora-riichi",
    label: "断幺九+リーチ+ドラ2",
    concealed: "234m345p456s33s678m",
    winningTile: "8m",
    winType: "ron",
    riichi: true,
    // 表示牌2s→ドラ3s。雀頭33sの2枚がドラ→ドラ2（表示牌1枚で実戦準拠。SPEC §5.4）。
    dora: ["3s"],
  },
  {
    id: "yakuhai-haku-tsumo",
    label: "役牌(白)のみ ツモ",
    // 雀頭は白(5z)と別の牌(3z)にする。同一牌が555z(刻子3)+55z(雀頭2)=5枚は
    // 麻雀のルール上あり得ない（牌は各4枚まで。SPEC.md §4.1）。
    concealed: "234m567p789s33z555z",
    winningTile: "5z",
    winType: "tsumo",
  },
  {
    id: "yakuhai-seat-and-round-wind",
    label: "ダブル東(自風+場風)刻子",
    concealed: "234m567p789s55s111z",
    winningTile: "1z",
    winType: "ron",
    seatWind: "east",
    roundWind: "east",
  },
  {
    id: "yakuhai-south-round-non-dealer",
    label: "南場での役牌(場風のみ)",
    concealed: "234m567p789s55s222z",
    winningTile: "2z",
    winType: "ron",
    seatWind: "south",
    roundWind: "south",
  },

  // --- 40符・50符・60符・70符などfuTypeの多様性 ---
  {
    id: "fu-50-yakuhai-pair-plus-kanchan",
    label: "役牌雀頭+ダブル東暗刻+嵌張",
    concealed: "123m789s55z46p5p111z",
    winningTile: "5p",
    winType: "ron",
    seatWind: "east", // ダブル東（自風=東）が成立する親の手
  },
  {
    id: "fu-40-ankou-tanki",
    label: "老頭暗刻+単騎(リーチ)",
    concealed: "111m456p789s234s4z4z",
    winningTile: "4z",
    winType: "ron",
    riichi: true,
  },
  {
    id: "fu-50-ankou-plus-ryanmen",
    label: "老頭暗刻+中張暗刻+両面(リーチ)",
    concealed: "111m99m555p234s567s",
    winningTile: "7s",
    winType: "ron",
    riichi: true,
  },
  {
    id: "fu-60-triple-ankou",
    label: "字牌暗刻×3+嵌張",
    concealed: "111z222z333z46p5p77s",
    winningTile: "5p",
    winType: "ron",
  },

  // --- 一盃口・二盃口 ---
  {
    id: "iipeikou-ryanmen",
    label: "一盃口",
    concealed: "112233m789p44z567s",
    winningTile: "7s",
    winType: "ron",
  },
  {
    id: "ryanpeikou",
    label: "二盃口",
    concealed: "112233m44z556677p",
    winningTile: "7p",
    winType: "ron",
  },

  // --- 三色同順・一気通貫（門前/鳴き） ---
  {
    id: "sanshoku-menzen",
    label: "三色同順(門前2翻)",
    concealed: "123m123p123s44z678s",
    winningTile: "8s",
    winType: "ron",
  },
  {
    id: "sanshoku-open",
    label: "三色同順(鳴き1翻)",
    concealed: "123m123p44z678s",
    melds: [{ type: "chi", tiles: ["1s", "2s", "3s"] }],
    winningTile: "8s",
    winType: "ron",
  },
  {
    id: "ittsuu-menzen",
    label: "一気通貫(門前2翻)",
    concealed: "123456789m44z678p",
    winningTile: "8p",
    winType: "ron",
  },
  {
    id: "ittsuu-open",
    label: "一気通貫(鳴き1翻)",
    concealed: "12345678m44z9m",
    melds: [{ type: "chi", tiles: ["6p", "7p", "8p"] }],
    winningTile: "9m",
    winType: "ron",
  },

  // --- チャンタ・ジュンチャン ---
  {
    id: "chanta",
    label: "混全帯幺九(チャンタ)",
    concealed: "123m789p11z123s789m",
    winningTile: "9m",
    winType: "ron",
  },
  {
    id: "junchan",
    label: "純全帯幺九(ジュンチャン)",
    concealed: "123m789p99s123s789m",
    winningTile: "9m",
    winType: "ron",
  },

  // --- 対々和・三暗刻・三色同刻・三槓子 ---
  {
    id: "toitoi-ron",
    label: "対々和(ロン、シャンポン明刻扱い)",
    concealed: "111m222p333s44z55z5z",
    winningTile: "5z",
    winType: "ron",
  },
  {
    id: "sanankou-tsumo",
    label: "三暗刻(ツモ、四暗刻にはならない形)",
    concealed: "111m222p333s44z456s",
    winningTile: "5s",
    winType: "tsumo",
  },
  {
    id: "sanshoku-doukou",
    label: "三色同刻",
    concealed: "555m555p555s44z666z",
    winningTile: "6z",
    winType: "ron",
  },
  {
    id: "sankantsu",
    label: "三槓子",
    concealed: "46p5p99s",
    melds: [
      { type: "ankan", tiles: ["1m", "1m", "1m", "1m"] },
      { type: "ankan", tiles: ["2m", "2m", "2m", "2m"] },
      { type: "minkan", tiles: ["3m", "3m", "3m", "3m"], calledIndex: 0 },
    ],
    winningTile: "5p",
    winType: "ron",
  },

  // --- 混老頭・小三元 ---
  {
    id: "honroutou",
    label: "混老頭",
    concealed: "111m999p111s55z333z",
    winningTile: "3z",
    winType: "ron",
  },
  {
    id: "shousangen",
    label: "小三元",
    concealed: "123m123p555z666z77z",
    winningTile: "7z",
    winType: "tsumo",
  },

  // --- 混一色・清一色（門前/鳴き） ---
  {
    id: "honitsu-menzen",
    label: "混一色(門前3翻)",
    concealed: "123m456m22z789m444z",
    winningTile: "4z",
    winType: "tsumo",
  },
  {
    id: "honitsu-open",
    label: "混一色(鳴き2翻)",
    concealed: "123m789m111z22z",
    melds: [{ type: "pon", tiles: ["4m", "4m", "4m"], calledIndex: 0 }],
    winningTile: "2z",
    winType: "tsumo",
    seatWind: "east", // 自風=東（111zが自風牌）が成立する親の手
  },
  {
    id: "chinitsu-menzen",
    label: "清一色(門前6翻)",
    concealed: "123456789m11m444m",
    winningTile: "4m",
    winType: "tsumo",
  },
  {
    id: "chinitsu-open",
    label: "清一色(鳴き5翻)",
    concealed: "123456789m11m",
    melds: [{ type: "pon", tiles: ["4m", "4m", "4m"], calledIndex: 0 }],
    winningTile: "4m",
    winType: "tsumo",
  },

  // --- 七対子とその複合 ---
  {
    id: "chiitoitsu-plain",
    label: "七対子(25符固定)",
    concealed: "22m44m66m88p11s33s5z5z",
    winningTile: "5z",
    winType: "ron",
    riichi: true,
  },
  {
    id: "chiitoitsu-tanyao",
    label: "七対子+断幺九",
    concealed: "22m44m66m88p22s33s5s5s",
    winningTile: "5s",
    winType: "ron",
  },
  {
    id: "chiitoitsu-honitsu",
    label: "七対子+混一色",
    concealed: "22m44m66m88m11z33z5z5z",
    winningTile: "5z",
    winType: "ron",
  },

  // --- 役満 ---
  {
    id: "yakuman-suuankou-tanki",
    label: "四暗刻(単騎、役満)",
    concealed: "111m222p333s444z55z",
    winningTile: "5z",
    winType: "ron",
  },
  {
    id: "yakuman-suuankou-tsumo",
    label: "四暗刻(ツモ、役満)",
    concealed: "111m222p333s44z55z5z",
    winningTile: "5z",
    winType: "tsumo",
  },
  {
    id: "yakuman-daisangen",
    label: "大三元(役満)",
    concealed: "555z666z777z123m44m",
    winningTile: "4m",
    winType: "tsumo",
    seatWind: "east", // 親（東家）
  },
  {
    id: "yakuman-tsuuiisou",
    label: "字一色(役満)",
    concealed: "111z222z333z55z666z",
    winningTile: "6z",
    winType: "tsumo",
  },
  {
    id: "yakuman-tsuuiisou-chiitoitsu",
    label: "字一色(七対子形、役満)",
    concealed: "11z22z33z44z55z66z77z",
    winningTile: "7z",
    winType: "ron",
  },
  {
    id: "yakuman-ryuuiisou",
    label: "緑一色(役満)",
    concealed: "222s333s444s66z888s",
    winningTile: "8s",
    winType: "tsumo",
  },
  {
    id: "yakuman-chinroutou",
    label: "清老頭(役満)",
    concealed: "111m999m111p999p11s",
    winningTile: "1s",
    winType: "tsumo",
  },
  {
    id: "yakuman-shousuushi",
    label: "小四喜(役満)",
    concealed: "111z222z333z44z55z5z",
    winningTile: "5z",
    winType: "tsumo",
  },
  {
    id: "yakuman-daisuushi",
    label: "大四喜(役満)",
    concealed: "111z222z333z444z55m",
    winningTile: "5m",
    winType: "tsumo",
  },
  {
    id: "yakuman-suukantsu",
    label: "四槓子(役満)",
    concealed: "55p",
    melds: [
      { type: "ankan", tiles: ["1m", "1m", "1m", "1m"] },
      { type: "ankan", tiles: ["2m", "2m", "2m", "2m"] },
      { type: "minkan", tiles: ["3m", "3m", "3m", "3m"], calledIndex: 0 },
      { type: "minkan", tiles: ["4m", "4m", "4m", "4m"], calledIndex: 0 },
    ],
    winningTile: "5p",
    winType: "ron",
  },
  {
    id: "yakuman-chuurenpoutou",
    label: "九蓮宝燈(役満)",
    concealed: "11123455678999m",
    winningTile: "5m",
    winType: "tsumo",
  },
  {
    id: "yakuman-kokushi",
    label: "国士無双(役満)",
    concealed: "19m19p19s1234567z1m",
    winningTile: "1m",
    winType: "ron",
  },
  {
    id: "yakuman-kokushi-13wait",
    label: "国士無双(十三面待ち相当、役満)",
    concealed: "19m19p19s1234567z9m",
    winningTile: "9m",
    winType: "tsumo",
  },

  // --- 数え役満 ---
  {
    id: "kazoe-yakuman",
    label: "数え役満(清一色+一気通貫+リーチ+ツモ+ドラ、役満扱い)",
    // 役で13翻超を作る（ドラ表示牌の積み上げに頼らない）。清一色6+一通2+門前ツモ1+リーチ1+ドラ4+裏3=17翻。
    concealed: "123456789m11m444m",
    winningTile: "4m",
    winType: "tsumo",
    riichi: true,
    dora: ["4m"], // 表示牌3m→ドラ4m。手牌に4mが4枚→ドラ4
    uraDora: ["1m"], // 表示牌9m→裏1m。手牌に1mが3枚→裏3（表示牌はドラと同じ1枚で整合）
  },

  // --- 高点法（複数解釈） ---
  {
    id: "takamehou-sequence-vs-triplet",
    label: "高点法: 三順子/三刻子の曖昧形",
    concealed: "222333444m789p55s",
    winningTile: "4m",
    winType: "tsumo",
  },

  // --- 赤ドラ・裏ドラ ---
  {
    id: "aka-dora-one",
    label: "赤ドラ1枚",
    concealed: "234m0p67p33z345s789m",
    winningTile: "9m",
    winType: "ron",
    riichi: true,
  },
  {
    id: "ura-dora-with-riichi",
    label: "裏ドラ(リーチ時のみ加算)",
    concealed: "234m567p345s33m678m",
    winningTile: "6m",
    winType: "ron",
    riichi: true,
    uraDora: ["2m"],
  },

  // --- 親のツモ・ロン ---
  {
    id: "dealer-tsumo-haneman",
    label: "親ツモ 跳満",
    concealed: "123m123p123s44z678s",
    winningTile: "8s",
    winType: "tsumo",
    seatWind: "east", // 親（東家）
    riichi: true,
    // 表示牌3z→ドラ4z。雀頭44zの2枚がドラ→ドラ2（表示牌1枚で実戦準拠。SPEC §5.4）。
    dora: ["4z"],
  },
  {
    id: "dealer-ron-haneman",
    label: "親ロン 跳満",
    // 678sの代わりに5s暗槓を持つ（槓は幺九牌を含まないためチャンタ非成立、役牌でもない）。
    // 槓が1つあるためドラ表示牌は2枚（1+槓数。SPEC §5.4）で正当化できる。
    concealed: "123m123p123s44z",
    melds: [{ type: "ankan", tiles: ["5s", "5s", "5s", "5s"] }],
    winningTile: "3s",
    winType: "ron",
    seatWind: "east", // 親（東家）
    riichi: true,
    // 表示牌9m→ドラ1m(1枚)、表示牌3z→ドラ4z(雀頭2枚)。ドラ合計3（表示牌2枚=1+槓1）。
    dora: ["1m", "4z"],
  },
];

function determineFuType(input: ScoreHandInput): number {
  const result = scoreHand(input);
  return result?.fu ?? 0;
}

const problems: Problem[] = specs.map((spec) => {
  const input = toScoreHandInput(spec);
  const answer = scoreHand(input);
  if (!answer) {
    throw new Error(
      `問題 "${spec.id}" (${spec.label}) は役なしで不成立です。定義を見直してください。`,
    );
  }
  return {
    id: spec.id,
    source: "bank",
    hand: {
      concealed: input.concealed,
      melds: input.melds,
      winningTile: input.winningTile,
      winType: input.winType,
    },
    doraIndicators: input.doraIndicators,
    uraDoraIndicators: input.uraDoraIndicators,
    conditions: {
      seatWind: input.seatWind,
      roundWind: input.roundWind,
      isDealer: input.isDealer,
      riichi: input.riichi,
    },
    answer,
    tags: {
      fuType: determineFuType(input),
      yakuCategories: answer.yaku.map((y) => y.name),
    },
  } satisfies Problem;
});

const outPath = resolve(__dirname, "../src/data/problemBank.json");
writeFileSync(outPath, JSON.stringify(problems, null, 2) + "\n", "utf-8");
console.log(`問題バンクを生成しました: ${problems.length}問 -> ${outPath}`);
