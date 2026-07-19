import { IndexedDbSettingsRepository } from "./indexedDbSettingsRepository";
import type { SettingsRepository } from "../application/settingsRepository";

/**
 * 既定の設定リポジトリ実装(合成ルート)。アプリ全体はここで生成した1つのインスタンスを使う。
 * 将来IndexedDBから別の永続化手段(サーバDB等)へ移行する場合は、
 * ここの実装を差し替えるだけでよい構成にしている。
 */
export const settingsRepository: SettingsRepository = new IndexedDbSettingsRepository();
