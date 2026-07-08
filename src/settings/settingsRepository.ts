import type { AppSettings } from "./appSettings";

/**
 * 設定の永続化を抽象化するインターフェース。UI・フックはこれにのみ依存し、
 * IndexedDB等の具体的な永続化手段には直接依存しない。
 * 将来IndexedDBから別のDBへ移行する際は、この抽象を満たす実装を差し替えるだけでよい。
 */
export interface SettingsRepository {
  load(): Promise<AppSettings>;
  save(next: AppSettings): Promise<void>;
}
