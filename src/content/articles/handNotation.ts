import type { Tile } from "../../engine/model";
import { parseTileNotation } from "../../engine/tiles";

export interface ParsedHand {
  hand: Tile[];
  winningTile?: Tile;
  /** 門前での翻数ラベル（例 "1"）。未指定なら undefined。 */
  menzen?: string;
  /** 鳴き（喰い下がり）での翻数ラベル。"-" や "×" は不成立（門前のみ等）。 */
  naki?: string;
}

const GROUP_PATTERN = /^([0-9]+)([mpsz])$/;
const KEY_LINE_PATTERN = /^(\w+)\s*:\s*(.*)$/;

/** グループ記法(例: "234m", "99z")を牌配列に展開する。不正なら null。 */
function expandGroup(token: string): Tile[] | null {
  const match = GROUP_PATTERN.exec(token);
  if (!match) return null;
  const [, digits, suit] = match;
  const tiles: Tile[] = [];
  for (const digit of digits) {
    try {
      tiles.push(parseTileNotation(`${digit}${suit}`));
    } catch {
      return null;
    }
  }
  return tiles;
}

/** 牌姿＋上がり牌の記法(例: "234m 567p 345s 99m | 9p")をパースする。不正なら null。 */
function parseHandAndWin(input: string): Pick<ParsedHand, "hand" | "winningTile"> | null {
  const [handPart, ...rest] = input.trim().split("|");
  if (rest.length > 1) return null;

  const handTokens = (handPart ?? "").trim().split(/\s+/).filter(Boolean);
  if (handTokens.length === 0) return null;

  const hand: Tile[] = [];
  for (const token of handTokens) {
    const group = expandGroup(token);
    if (!group) return null;
    hand.push(...group);
  }

  const winPart = rest[0]?.trim();
  if (!winPart) {
    return { hand };
  }

  const winTokens = winPart.split(/\s+/).filter(Boolean);
  if (winTokens.length !== 1) return null;
  const winGroup = expandGroup(winTokens[0]);
  if (!winGroup || winGroup.length !== 1) return null;

  return { hand, winningTile: winGroup[0] };
}

/**
 * 記事内の牌姿記法をパースする。2形式に対応する:
 * - キー行形式（複数行）: `hand: 234m ... | 9p` / `menzen: 1` / `naki: -`
 * - 単一行の牌のみ形式（後方互換）: `234m 567p 345s 99m | 9p`
 * 不正な記法は throw せず null を返す（呼び出し側でフォールバック表示する）。
 */
export function parseHandNotation(input: string): ParsedHand | null {
  const lines = input
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;

  const hasKeys = lines.some((line) => /^(hand|menzen|naki)\s*:/i.test(line));
  if (!hasKeys) {
    // 後方互換: 全体を牌のみ記法として解釈。
    return parseHandAndWin(input);
  }

  let handResult: Pick<ParsedHand, "hand" | "winningTile"> | null = null;
  let menzen: string | undefined;
  let naki: string | undefined;

  for (const line of lines) {
    const match = KEY_LINE_PATTERN.exec(line);
    if (!match) return null;
    const key = match[1].toLowerCase();
    const value = match[2].trim();
    if (key === "hand") {
      handResult = parseHandAndWin(value);
      if (!handResult) return null;
    } else if (key === "menzen") {
      menzen = value;
    } else if (key === "naki") {
      naki = value;
    } else {
      return null; // 未知キー。
    }
  }

  if (!handResult) return null;
  return { ...handResult, menzen, naki };
}
