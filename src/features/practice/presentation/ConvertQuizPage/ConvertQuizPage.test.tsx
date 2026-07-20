import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, type AppSettings } from "@/features/settings/domain/appSettings";
import { SettingsProvider } from "@/features/settings/presentation/SettingsContext";
import type { SettingsRepository } from "@/features/settings/application/settingsRepository";
import { ConvertQuizPage } from "./ConvertQuizPage";

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

function renderConvert(repository: SettingsRepository = createInMemoryRepository()) {
  return render(
    <MemoryRouter initialEntries={["/convert"]}>
      <SettingsProvider repository={repository}>
        <Routes>
          <Route path="/convert" element={<ConvertQuizPage />} />
        </Routes>
      </SettingsProvider>
    </MemoryRouter>,
  );
}

describe("ConvertQuizPage", () => {
  it("renders the question conditions, 4 choices, and a skip button without a hand", () => {
    const { container } = renderConvert();
    expect(screen.getByRole("heading", { name: "点数換算" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "次の問題へ" })).toBeInTheDocument();
    expect(container.querySelectorAll(".quiz-choice-btn")).toHaveLength(4);
    expect(document.querySelector(".mj-tile")).toBeNull();
  });

  it("shows the fu/han as a flashcard and dealer/winType as condition badges", () => {
    const { container } = renderConvert();
    const flashcard = container.querySelector(".convert-flashcard-value");
    expect(flashcard?.textContent).toMatch(/^\d+符\d+翻$/);

    const conditions = screen.getByRole("region", { name: "条件" });
    expect(conditions.textContent).toMatch(/[親子]/);
    expect(conditions.textContent).toMatch(/ツモ|ロン/);
    // 符・翻は条件バッジ側には出さず、フラッシュカード側にのみ表示する。
    expect(conditions.textContent).not.toMatch(/符|翻/);
  });

  it("selecting a choice reveals the verdict, answer, and formula inside the flashcard (no navigation)", () => {
    const { container } = renderConvert();
    const flashcard = container.querySelector(".convert-flashcard");
    const resultZone = flashcard?.querySelector(".convert-flashcard-result");
    expect(resultZone).toHaveAttribute("aria-hidden", "true");
    expect(resultZone).not.toHaveClass("convert-flashcard-result--revealed");

    const choiceButtons = container.querySelectorAll(".quiz-choice-btn");
    fireEvent.click(choiceButtons[0]);

    // 結果は出題カード（フラッシュカード）の中に表示される。別カードや別画面ではない。
    expect(flashcard?.querySelector(".result-answer")?.textContent).toMatch(/^答え:/);
    expect(flashcard?.querySelector(".result-verdict")?.textContent).toMatch(/○ 正解|✕ 不正解/);
    expect(resultZone).toHaveAttribute("aria-hidden", "false");
    expect(resultZone).toHaveClass("convert-flashcard-result--revealed");
    // 点数換算モードは同一画面（解説画面には遷移しない）。
    expect(screen.queryByRole("heading", { name: "解説" })).not.toBeInTheDocument();
  });

  it("計算式は指数部が上付き(sup)で表示され、平文はaria-labelで読み上げられる", () => {
    const { container } = renderConvert();
    const choiceButtons = container.querySelectorAll(".quiz-choice-btn");
    fireEvent.click(choiceButtons[0]);

    const formula = container.querySelector(".convert-formula");
    const sup = formula?.querySelector("sup");
    expect(sup?.textContent).toMatch(/^\(2\+\d+翻\)$/);

    const ariaLabel = formula?.getAttribute("aria-label");
    expect(ariaLabel).toMatch(/^\d+符 × 2\^\(2\+\d+翻\) /);
    expect(ariaLabel).toContain("=");
  });

  it("回答前後で選択肢・「次の問題へ」ボタンの位置（DOM上の並び）が変わらない", () => {
    const { container } = renderConvert();
    const sectionsBefore = Array.from(container.querySelectorAll("main > *")).map(
      (el) => el.className,
    );

    const choiceButtons = container.querySelectorAll(".quiz-choice-btn");
    fireEvent.click(choiceButtons[0]);

    const sectionsAfter = Array.from(container.querySelectorAll("main > *")).map(
      (el) => el.className,
    );
    // 回答結果は出題カード内に追加されるだけで、main直下の要素構成（page-header→
    // 条件バッジ→出題カード→選択肢→次へボタン）自体は増減しない。
    expect(sectionsAfter).toEqual(sectionsBefore);
  });

  it("次の問題へ replaces the question and hides the inline result again", () => {
    const { container } = renderConvert();
    const choiceButtons = container.querySelectorAll(".quiz-choice-btn");
    fireEvent.click(choiceButtons[0]);
    expect(container.querySelector(".convert-flashcard-result")).toHaveClass(
      "convert-flashcard-result--revealed",
    );

    fireEvent.click(screen.getByRole("button", { name: "次の問題へ" }));
    const resultZone = container.querySelector(".convert-flashcard-result");
    expect(resultZone).toHaveAttribute("aria-hidden", "true");
    expect(resultZone).not.toHaveClass("convert-flashcard-result--revealed");
    expect(container.querySelectorAll(".quiz-choice-btn")).toHaveLength(4);
  });

  it("shows no stats link, only home, inside the sidebar (点数換算モードは成績に連携しない)", () => {
    renderConvert();
    expect(screen.queryByRole("link", { name: "ホーム" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "メニューを開く" }));
    expect(screen.queryByRole("link", { name: "成績" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ホーム" })).toBeInTheDocument();
  });

  it("切り上げ満貫ON: 満貫切上タグが表示される", async () => {
    const repo = createInMemoryRepository({ schemaVersion: 1, roundUpMangan: true });
    renderConvert(repo);
    expect(await screen.findByText("満貫切上")).toBeInTheDocument();
  });

  it("切り上げ満貫OFF: 満貫切上タグは表示されない", async () => {
    const repo = createInMemoryRepository({ schemaVersion: 1, roundUpMangan: false });
    renderConvert(repo);
    await waitFor(() => expect(screen.queryByText("満貫切上")).not.toBeInTheDocument());
  });

  it("点数早見表ボタンがヘッダー（ハンバーガーの隣）にある", () => {
    const { container } = renderConvert();
    const tableBtn = screen.getByRole("button", { name: "点数早見表を開く" });
    const hamburger = screen.getByRole("button", { name: "メニューを開く" });

    const actions = container.querySelector(".page-header-actions");
    expect(actions?.contains(tableBtn)).toBe(true);
    expect(actions?.contains(hamburger)).toBe(true);
  });
});
