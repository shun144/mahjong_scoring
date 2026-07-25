import type { ScoreRank } from "./types";

export const RANK_LABELS: Record<ScoreRank, string> = {
  mangan: "満貫",
  haneman: "跳満",
  baiman: "倍満",
  sanbaiman: "三倍満",
  yakuman: "役満",
};

export const RANK_TABLE: Record<
  ScoreRank,
  {
    ronKo: number;
    ronOya: number;
    tsumoKoFromKo: number;
    tsumoKoFromOya: number;
    tsumoOyaEach: number;
  }
> = {
  mangan: {
    ronKo: 8000,
    ronOya: 12000,
    tsumoKoFromKo: 2000,
    tsumoKoFromOya: 4000,
    tsumoOyaEach: 4000,
  },
  haneman: {
    ronKo: 12000,
    ronOya: 18000,
    tsumoKoFromKo: 3000,
    tsumoKoFromOya: 6000,
    tsumoOyaEach: 6000,
  },
  baiman: {
    ronKo: 16000,
    ronOya: 24000,
    tsumoKoFromKo: 4000,
    tsumoKoFromOya: 8000,
    tsumoOyaEach: 8000,
  },
  sanbaiman: {
    ronKo: 24000,
    ronOya: 36000,
    tsumoKoFromKo: 6000,
    tsumoKoFromOya: 12000,
    tsumoOyaEach: 12000,
  },
  yakuman: {
    ronKo: 32000,
    ronOya: 48000,
    tsumoKoFromKo: 8000,
    tsumoKoFromOya: 16000,
    tsumoOyaEach: 16000,
  },
};
