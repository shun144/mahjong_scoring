import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../domain/appSettings";
import { DB_NAME, IndexedDbSettingsRepository } from "./indexedDbSettingsRepository";

afterEach(async () => {
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
});

describe("IndexedDbSettingsRepository", () => {
  it("未保存の状態ではDEFAULT_SETTINGSを返す", async () => {
    const repo = new IndexedDbSettingsRepository();
    expect(await repo.load()).toEqual(DEFAULT_SETTINGS);
  });

  it("saveした内容がloadで復元できる(往復)", async () => {
    const repo = new IndexedDbSettingsRepository();
    await repo.save({ schemaVersion: 1, roundUpMangan: true });
    expect(await repo.load()).toEqual({ schemaVersion: 1, roundUpMangan: true });
  });

  it("別インスタンスからでも保存済みの値を読み込める(DB越し)", async () => {
    const writer = new IndexedDbSettingsRepository();
    await writer.save({ schemaVersion: 1, roundUpMangan: true });

    const reader = new IndexedDbSettingsRepository();
    expect(await reader.load()).toEqual({ schemaVersion: 1, roundUpMangan: true });
  });
});
