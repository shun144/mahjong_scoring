import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { Problem } from "../../domain/problem";
import { scoreHand } from "../../../../engine/scoreHand";
import { parseTileNotation } from "../../../../engine/tiles";
import { loadStats } from "../../application/statsStore";
import { FuQuizPage } from "./FuQuizPage";
import { FuResultPage } from "../FuResultPage/FuResultPage";
import { StatsPage } from "../StatsPage/StatsPage";

function renderFuQuiz() {
  return render(
    <MemoryRouter initialEntries={["/fu/quiz"]}>
      <Routes>
        <Route path="/fu/quiz" element={<FuQuizPage />} />
        <Route path="/fu/result" element={<FuResultPage />} />
        <Route path="/stats" element={<StatsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderFuQuizWithProblem(problem: Problem) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/fu/quiz", state: { problem, review: true } }]}>
      <Routes>
        <Route path="/fu/quiz" element={<FuQuizPage />} />
        <Route path="/fu/result" element={<FuResultPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function tiles(compact: string) {
  const parts = compact.match(/\d+[mpsz]/g) ?? [];
  const out: ReturnType<typeof parseTileNotation>[] = [];
  for (const part of parts) {
    const suit = part[part.length - 1];
    for (const digit of part.slice(0, -1)) out.push(parseTileNotation(`${digit}${suit}`));
  }
  return out;
}

// リーチ+平和+ドラ2 = 4翻30符（満貫未満）の手。riichi の有無だけ切り替えて使う。
function riichiHandProblem(riichi: boolean): Problem {
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
    riichi,
  };
  const doraIndicators = [parseTileNotation("2s"), parseTileNotation("6p")];
  const answer = scoreHand({
    ...hand,
    doraIndicators,
    uraDoraIndicators: [],
    ...conditions,
  });
  if (!answer) throw new Error("テスト用の手が不正です");

  return {
    id: `test-fu-riichi-${riichi}`,
    source: "generated",
    hand,
    doraIndicators,
    uraDoraIndicators: [],
    conditions,
    answer,
    tags: { fuType: 30, yakuCategories: ["リーチ", "平和"] },
  };
}

describe("FuQuizPage", () => {
  it("renders the hand, conditions, 4 fu choices, and a skip button", () => {
    const { container } = renderFuQuiz();
    expect(screen.getByRole("heading", { name: "符計算" })).toBeInTheDocument();
    expect(container.querySelectorAll(".quiz-choice-btn")).toHaveLength(4);
    expect(screen.getByRole("button", { name: "次の問題へ" })).toBeInTheDocument();
  });

  it("navigates to the fu result page immediately when a choice is clicked", () => {
    renderFuQuiz();
    const choiceButtons = screen
      .getAllByRole("button")
      .filter((b) => b.textContent?.endsWith("符"));
    fireEvent.click(choiceButtons[0]);

    expect(screen.getByRole("heading", { name: "解説" })).toBeInTheDocument();
    expect(screen.getByText(/答え:/)).toBeInTheDocument();
  });

  it("skipping stays on the fu quiz page without recording an answer", () => {
    localStorage.clear();
    renderFuQuiz();
    const before = loadStats().totalAnswered;

    fireEvent.click(screen.getByRole("button", { name: "次の問題へ" }));

    expect(screen.getByRole("heading", { name: "符計算" })).toBeInTheDocument();
    expect(loadStats().totalAnswered).toBe(before);
  });

  it("skipping loads a new problem (choice set is re-generated)", () => {
    const { container } = renderFuQuiz();
    fireEvent.click(screen.getByRole("button", { name: "次の問題へ" }));
    expect(container.querySelectorAll(".quiz-choice-btn")).toHaveLength(4);
  });

  it("returns to the fu quiz page (not the score quiz page) after viewing stats", () => {
    renderFuQuiz();
    fireEvent.click(screen.getByRole("button", { name: "メニューを開く" }));
    fireEvent.click(screen.getByRole("link", { name: "成績" }));
    expect(screen.getByRole("heading", { name: "成績" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "練習に戻る" }));
    expect(screen.getByRole("heading", { name: "符計算" })).toBeInTheDocument();
  });

  it("keeps the same problem and the same choice order after a stats round trip", () => {
    const { container } = renderFuQuiz();
    const choicesBefore = Array.from(container.querySelectorAll(".quiz-choice-btn")).map(
      (b) => b.textContent,
    );

    fireEvent.click(screen.getByRole("button", { name: "メニューを開く" }));
    fireEvent.click(screen.getByRole("link", { name: "成績" }));
    fireEvent.click(screen.getByRole("link", { name: "練習に戻る" }));

    const choicesAfter = Array.from(container.querySelectorAll(".quiz-choice-btn")).map(
      (b) => b.textContent,
    );
    expect(choicesAfter).toEqual(choicesBefore);
  });

  it("リーチの問題では、リーチ表示が上段の条件バッジではなくアガリ牌の右隣（点棒画像）に出る", () => {
    const { container } = renderFuQuizWithProblem(riichiHandProblem(true));

    const conditionsSection = container.querySelector(".quiz-conditions");
    expect(conditionsSection?.textContent).not.toContain("リーチ");

    const riichiSection = container.querySelector(".riichi-indicator-section");
    expect(riichiSection).not.toHaveClass("riichi-indicator-spacer");
    expect(riichiSection).not.toHaveAttribute("aria-hidden");
    expect(riichiSection?.textContent).toBe("リーチ");
    expect(riichiSection?.querySelector(".riichi-indicator-stick")).toBeInTheDocument();
  });

  it("非リーチの問題では、リーチ枠（「リーチ」ラベル＋点棒画像）は確保されるが非表示になる", () => {
    const { container } = renderFuQuizWithProblem(riichiHandProblem(false));

    const riichiSection = container.querySelector(".riichi-indicator-section");
    expect(riichiSection).toHaveClass("riichi-indicator-spacer");
    expect(riichiSection).toHaveAttribute("aria-hidden", "true");
  });
});
