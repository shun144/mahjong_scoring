import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { DEFAULT_SETTINGS, type AppSettings } from "./appSettings";
import { settingsRepository as defaultSettingsRepository } from "./settingsRepository.instance";
import type { SettingsRepository } from "./settingsRepository";

interface SettingsContextValue {
  settings: AppSettings;
  loading: boolean;
  updateSettings: (patch: Partial<AppSettings>) => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
  /** テスト等でインメモリ実装に差し替えるための注入口。既定は合成ルートのIndexedDB実装。 */
  repository?: SettingsRepository;
}

/**
 * 起動時に設定をロードし、以降はメモリ上の値をUIに配りつつ永続層へ反映するProvider。
 * IndexedDBの読み込みは非同期のため、ロード完了までは既定値+loading=trueを返す。
 */
export function SettingsProvider({ children, repository = defaultSettingsRepository }: SettingsProviderProps) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    repository.load().then((loaded) => {
      if (cancelled) return;
      setSettings(loaded);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [repository]);

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      setSettings((current) => {
        const next = { ...current, ...patch };
        // 楽観的にメモリを更新しつつ、永続化は非同期に実行する。
        // 保存失敗時もIndexedDbSettingsRepository側で握りつぶすため、UI操作自体は失敗しない。
        void repository.save(next);
        return next;
      });
    },
    [repository],
  );

  const value = useMemo(
    () => ({ settings, loading, updateSettings }),
    [settings, loading, updateSettings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings は SettingsProvider の内側でのみ使用できます。");
  }
  return ctx;
}
