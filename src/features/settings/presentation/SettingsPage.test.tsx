import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { SettingsProvider } from "./SettingsContext";
import type { AppSettings } from "../domain/appSettings";
import { DEFAULT_SETTINGS } from "../domain/appSettings";
import type { SettingsRepository } from "../application/settingsRepository";
import { SettingsPage } from "./SettingsPage";

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

function renderPage(repository: SettingsRepository) {
  return render(
    <MemoryRouter>
      <SettingsProvider repository={repository}>
        <SettingsPage />
      </SettingsProvider>
    </MemoryRouter>,
  );
}

describe("SettingsPage", () => {
  it("見出しとホームへの導線を表示する", async () => {
    renderPage(createInMemoryRepository());
    expect(screen.getByRole("heading", { name: "設定", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ホーム" })).toHaveAttribute("href", "/");
  });

  it("既定では切り上げ満貫トグルがONで表示される", async () => {
    renderPage(createInMemoryRepository());
    const toggle = await screen.findByRole("switch", { name: /切り上げ満貫/ });
    expect(toggle).toBeChecked();
  });

  it("保存済みの設定がOFFの場合はトグルもOFFで復元される", async () => {
    renderPage(createInMemoryRepository({ schemaVersion: 1, roundUpMangan: false }));
    const toggle = await screen.findByRole("switch", { name: /切り上げ満貫/ });
    await waitFor(() => expect(toggle).not.toBeChecked());
  });

  it("トグル操作でrepositoryへ保存される", async () => {
    const repo = createInMemoryRepository();
    renderPage(repo);
    const toggle = await screen.findByRole("switch", { name: /切り上げ満貫/ });

    toggle.click();

    await waitFor(async () => {
      expect(await repo.load()).toEqual({ schemaVersion: 1, roundUpMangan: false });
    });
    expect(toggle).not.toBeChecked();
  });
});
