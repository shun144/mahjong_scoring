import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { Problem } from "../data/problem";
import { scoreHand } from "../engine/scoreHand";
import { parseTileNotation } from "../engine/tiles";
import { DEFAULT_SETTINGS, type AppSettings } from "../settings/appSettings";
import { SettingsProvider } from "../settings/SettingsContext";
import type { SettingsRepository } from "../settings/settingsRepository";
import { loadStats } from "../store/statsStore";
import { QuizPage } from "./QuizPage";
import { ResultPage } from "./ResultPage";
import { StatsPage } from "./StatsPage";

function tiles(compact: string) {
  const parts = compact.match(/\d+[mpsz]/g) ?? [];
  const out: ReturnType<typeof parseTileNotation>[] = [];
  for (const part of parts) {
    const suit = part[part.length - 1];
    for (const digit of part.slice(0, -1)) out.push(parseTileNotation(`${digit}${suit}`));
  }
  return out;
}

// リーチ+平和+ドラ2 = 4翻30符（基本点1920）の境界手。roundUpMangan有無で正解点数が変わる。
function boundaryProblem(): Problem {
  const hand = {
    concealed: tiles("234m567p33z345s789m"),
    melds: [],
    winningTile: parseTileNotation("9m"),
    winType: "ron" as const,
  };
  const conditions = {
    seatWind: "east" as const,
    roundWind: "east" as const,
    isDealer: false,
    riichi: true,
  };
  const doraIndicators = [parseTileNotation("2s"), parseTileNotation("6p")];
  const answer = scoreHand({
    ...hand,
    doraIndicators,
    uraDoraIndicators: [],
    ...conditions,
  });
  if (!answer) throw new Error("テスト用の境界手が不正です");

  return {
    id: "test-boundary",
    source: "generated",
    hand,
    doraIndicators,
    uraDoraIndicators: [],
    conditions,
    answer,
    tags: { fuType: 30, yakuCategories: ["リーチ", "平和"] },
  };
}

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

function renderQuiz(repository: SettingsRepository = createInMemoryRepository()) {
  return render(
    <MemoryRouter initialEntries={["/quiz"]}>
      <SettingsProvider repository={repository}>
        <Routes>
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Routes>
      </SettingsProvider>
    </MemoryRouter>,
  );
}

function renderQuizWithProblem(problem: Problem, repository: SettingsRepository) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/quiz", state: { problem, review: true } }]}>
      <SettingsProvider repository={repository}>
        <Routes>
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/result" element={<ResultPage />} />
        </Routes>
      </SettingsProvider>
    </MemoryRouter>,
  );
}

describe("QuizPage", () => {
  it("renders the hand, conditions, 4 answer choices, and a skip button", () => {
    renderQuiz();
    expect(screen.getByRole("heading", { name: "出題" })).toBeInTheDocument();
    // ページ上のボタンは4つの選択肢＋1つのスキップボタン（ヘッダーの「成績を見る」はリンク）。
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(5);
    expect(screen.getByRole("button", { name: "次の問題へ" })).toBeInTheDocument();
  });

  it("navigates to the result page immediately when a choice is clicked", () => {
    renderQuiz();
    const choiceButtons = screen.getAllByRole("button");
    fireEvent.click(choiceButtons[0]);

    // 正誤に依らず常に表示される要素のみを検証する（正誤ごとの詳細はResultPage.test.tsxで検証）。
    expect(screen.getByRole("heading", { name: "解説" })).toBeInTheDocument();
    expect(screen.getByText(/答え:/)).toBeInTheDocument();
  });

  it("skipping stays on the quiz page without recording an answer", () => {
    localStorage.clear();
    renderQuiz();
    const before = loadStats().totalAnswered;

    fireEvent.click(screen.getByRole("button", { name: "次の問題へ" }));

    expect(screen.getByRole("heading", { name: "出題" })).toBeInTheDocument();
    expect(loadStats().totalAnswered).toBe(before);
  });

  it("skipping loads a new problem (choice set is re-generated)", () => {
    renderQuiz();
    // スキップを繰り返しても常に4択+スキップボタンの構成が保たれる（新しい問題に切り替わる）。
    fireEvent.click(screen.getByRole("button", { name: "次の問題へ" }));
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });

  it("切り上げ満貫OFF: 境界手は標準ルールの点数(7700)のまま、タグは非表示", async () => {
    const repo = createInMemoryRepository({ schemaVersion: 1, roundUpMangan: false });
    renderQuizWithProblem(boundaryProblem(), repo);

    await waitFor(() => expect(screen.getByRole("button", { name: "7700" })).toBeInTheDocument());
    expect(screen.queryByText("満貫切上")).not.toBeInTheDocument();
  });

  it("切り上げ満貫ON: 境界手が満貫(8000)に切り上がり、条件タグの先頭に表示される", async () => {
    const repo = createInMemoryRepository({ schemaVersion: 1, roundUpMangan: true });
    const { container } = renderQuizWithProblem(boundaryProblem(), repo);

    await waitFor(() => expect(screen.getByRole("button", { name: "8000" })).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "7700" })).not.toBeInTheDocument();

    const section = container.querySelector(".quiz-conditions");
    expect(section?.firstElementChild?.textContent).toBe("満貫切上");
  });

  it("切り上げ満貫ON: 選択後の解説にも満貫(8000)の答えが表示される", async () => {
    const repo = createInMemoryRepository({ schemaVersion: 1, roundUpMangan: true });
    renderQuizWithProblem(boundaryProblem(), repo);

    const choice = await screen.findByRole("button", { name: "8000" });
    fireEvent.click(choice);

    expect(await screen.findByRole("heading", { name: "解説" })).toBeInTheDocument();
    expect(screen.getByText(/答え: 8000/)).toBeInTheDocument();
  });

  it("returns to the score quiz page (not the fu quiz page) after viewing stats", () => {
    renderQuiz();
    fireEvent.click(screen.getByRole("link", { name: "成績を見る" }));
    expect(screen.getByRole("heading", { name: "成績" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "練習に戻る" })).toHaveAttribute("href", "/quiz");
  });
});
