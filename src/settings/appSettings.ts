/**
 * アプリ全体の設定ドメインモデル。永続層(IndexedDB等)には一切依存しない純粋モジュール。
 * schemaVersion は将来の設定項目追加・移行のための受け口。
 */
export interface AppSettings {
  schemaVersion: number;
  /**
   * 切り上げ満貫ルールを有効にするか（既定ON）。
   * 点数計算モードの採点(scoreHand/calculatePayment)に反映される（SPEC.md §4.8）。
   */
  roundUpMangan: boolean;
}

export const CURRENT_SCHEMA_VERSION = 1;

export const DEFAULT_SETTINGS: AppSettings = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  roundUpMangan: true,
};

/** 保存前提のバージョンより古いデータを現行スキーマへ引き上げる。現状は移行差分が無いため素通し。 */
function migrateSettings(value: AppSettings): AppSettings {
  if (value.schemaVersion >= CURRENT_SCHEMA_VERSION) return value;
  return { ...DEFAULT_SETTINGS, ...value, schemaVersion: CURRENT_SCHEMA_VERSION };
}

/** 未知の値(永続層から読み戻した値やJSON)を検証し、欠損・不正な項目は既定値で補う。 */
export function parseSettings(value: unknown): AppSettings {
  if (!value || typeof value !== "object") return DEFAULT_SETTINGS;
  const v = value as Record<string, unknown>;

  const schemaVersion = typeof v.schemaVersion === "number" ? v.schemaVersion : CURRENT_SCHEMA_VERSION;
  const roundUpMangan =
    typeof v.roundUpMangan === "boolean" ? v.roundUpMangan : DEFAULT_SETTINGS.roundUpMangan;

  return migrateSettings({ schemaVersion, roundUpMangan });
}
