import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, type AppSettings } from "../domain/appSettings";
import { SettingsProvider, useSettings } from "./SettingsContext";
import type { SettingsRepository } from "../application/settingsRepository";

/** テスト用のインメモリ実装。永続層を差し替えられることの確認も兼ねる。 */
function createInMemoryRepository(initial: AppSettings = DEFAULT_SETTINGS): SettingsRepository {
  let stored = initial;
  return {
    async load() {
      return stored;
    },
    async save(next) {
      stored = next;
    },
  };
}

function Probe() {
  const { settings, loading, updateSettings } = useSettings();
  if (loading) return <p>loading</p>;
  return (
    <div>
      <p>roundUpMangan: {String(settings.roundUpMangan)}</p>
      <button onClick={() => updateSettings({ roundUpMangan: !settings.roundUpMangan })}>
        toggle
      </button>
    </div>
  );
}

describe("SettingsProvider / useSettings", () => {
  it("初期ロード完了までloading=trueを経てDEFAULT_SETTINGSが反映される", async () => {
    const repo = createInMemoryRepository();
    render(
      <SettingsProvider repository={repo}>
        <Probe />
      </SettingsProvider>,
    );
    await waitFor(() => expect(screen.getByText(/roundUpMangan: true/)).toBeInTheDocument());
  });

  it("updateSettingsで即時反映(楽観更新)され、repositoryにも保存される", async () => {
    const repo = createInMemoryRepository();
    render(
      <SettingsProvider repository={repo}>
        <Probe />
      </SettingsProvider>,
    );
    await waitFor(() => expect(screen.getByText(/roundUpMangan: true/)).toBeInTheDocument());

    await act(async () => {
      screen.getByRole("button", { name: "toggle" }).click();
    });

    expect(screen.getByText(/roundUpMangan: false/)).toBeInTheDocument();
    expect(await repo.load()).toEqual({ schemaVersion: 1, roundUpMangan: false });
  });

  it("保存済みの値は次回起動時(再マウント)に復元される", async () => {
    const repo = createInMemoryRepository();
    await repo.save({ schemaVersion: 1, roundUpMangan: true });

    render(
      <SettingsProvider repository={repo}>
        <Probe />
      </SettingsProvider>,
    );

    await waitFor(() => expect(screen.getByText(/roundUpMangan: true/)).toBeInTheDocument());
  });
});
