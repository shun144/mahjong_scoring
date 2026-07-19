import { describe, expect, it } from "vitest";
import { CURRENT_SCHEMA_VERSION, DEFAULT_SETTINGS, parseSettings } from "./appSettings";

describe("DEFAULT_SETTINGS", () => {
  it("切り上げ満貫は既定ON", () => {
    expect(DEFAULT_SETTINGS.roundUpMangan).toBe(true);
    expect(DEFAULT_SETTINGS.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });
});

describe("parseSettings", () => {
  it("正しい形の値はそのまま復元する", () => {
    expect(parseSettings({ schemaVersion: 1, roundUpMangan: true })).toEqual({
      schemaVersion: 1,
      roundUpMangan: true,
    });
    // 既定値がtrueでも、明示的なfalseは既定値に上書きされず尊重される。
    expect(parseSettings({ schemaVersion: 1, roundUpMangan: false })).toEqual({
      schemaVersion: 1,
      roundUpMangan: false,
    });
  });

  it("undefined/nullは既定値を返す", () => {
    expect(parseSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it("オブジェクトでない値は既定値を返す", () => {
    expect(parseSettings("broken")).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings(42)).toEqual(DEFAULT_SETTINGS);
  });

  it("roundUpManganが欠損/不正な場合は既定値(true)で補完する", () => {
    expect(parseSettings({ schemaVersion: 1 })).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings({ schemaVersion: 1, roundUpMangan: "yes" })).toEqual(DEFAULT_SETTINGS);
  });

  it("schemaVersionが欠損/古い場合は現行バージョンへ引き上げる", () => {
    expect(parseSettings({ roundUpMangan: true })).toEqual({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      roundUpMangan: true,
    });
    expect(parseSettings({ schemaVersion: 0, roundUpMangan: true })).toEqual({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      roundUpMangan: true,
    });
  });
});
