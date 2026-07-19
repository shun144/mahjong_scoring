import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { DEFAULT_SETTINGS, parseSettings, type AppSettings } from "../domain/appSettings";
import type { SettingsRepository } from "../application/settingsRepository";

/** テストのDB後片付け(indexedDB.deleteDatabase)のためexportしている。 */
export const DB_NAME = "mahjong-scoring:settings";
const DB_VERSION = 1;
const STORE_NAME = "settings";
/** 単一レコードのみを保存するため、固定キーで読み書きする。 */
const RECORD_KEY = "app-settings";

interface SettingsDbSchema extends DBSchema {
  [STORE_NAME]: {
    key: typeof RECORD_KEY;
    value: AppSettings;
  };
}

function openSettingsDb(): Promise<IDBPDatabase<SettingsDbSchema>> {
  return openDB<SettingsDbSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

/**
 * IndexedDBを永続化先とする SettingsRepository 実装。
 * IndexedDBが使えない環境(プライベートモード等)や読み込み失敗時は、
 * 既定値へフォールアウトする(statsStoreのlocalStorage耐障害方針に倣う)。
 */
export class IndexedDbSettingsRepository implements SettingsRepository {
  async load(): Promise<AppSettings> {
    try {
      const db = await openSettingsDb();
      const raw = await db.get(STORE_NAME, RECORD_KEY);
      db.close();
      return raw ? parseSettings(raw) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  async save(next: AppSettings): Promise<void> {
    try {
      const db = await openSettingsDb();
      await db.put(STORE_NAME, next, RECORD_KEY);
      db.close();
    } catch {
      // IndexedDBが使えない環境では黙って諦める(設定はメモリ上には反映済み)。
    }
  }
}
