import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import type { Problem } from "../data/problem";
import { recordAnswer } from "../store/statsStore";
import { StatsPage } from "./StatsPage";

function fakeProblem(fuType: number, yakuCategories: string[]): Problem {
  return {
    id: "p1",
    source: "bank",
    hand: { concealed: [], melds: [], winningTile: { suit: "m", rank: 1 }, winType: "ron" },
    doraIndicators: [],
    uraDoraIndicators: [],
    conditions: { seatWind: "east", roundWind: "east", isDealer: false, riichi: false },
    answer: { yaku: [], han: 1, fu: fuType, payment: { kind: "ron", total: 1000 } },
    tags: { fuType, yakuCategories },
  };
}

function renderStats() {
  return render(
    <MemoryRouter initialEntries={["/stats"]}>
      <Routes>
        <Route path="/stats" element={<StatsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("StatsPage", () => {
  it("shows a start-practicing prompt when there is no history yet", () => {
    renderStats();
    expect(screen.getByText(/まだ回答履歴がありません/)).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("shows the overall accuracy, current streak, and best streak", () => {
    recordAnswer(fakeProblem(30, ["リーチ"]), true);
    recordAnswer(fakeProblem(30, ["リーチ"]), true);
    recordAnswer(fakeProblem(40, ["平和"]), false);
    renderStats();

    expect(screen.getByText("67%")).toBeInTheDocument(); // 2/3
    expect(screen.getByText("2/3問")).toBeInTheDocument();
    // 連続正解は最後がミスなので0、最高連続正解は2
    const values = screen.getAllByText("0");
    expect(values.length).toBeGreaterThan(0);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("lists per-fuType and per-yaku accuracy, worst first", () => {
    recordAnswer(fakeProblem(30, ["リーチ"]), true);
    recordAnswer(fakeProblem(30, ["リーチ"]), true);
    recordAnswer(fakeProblem(40, ["平和"]), false);
    renderStats();

    expect(screen.getByText("30符")).toBeInTheDocument();
    expect(screen.getByText("40符")).toBeInTheDocument();
    expect(screen.getByText("リーチ")).toBeInTheDocument();
    expect(screen.getByText("平和")).toBeInTheDocument();

    // 40符(0%)が30符(100%)より苦手側(先)に表示される
    const fuLabels = screen.getAllByText(/^\d+符$/).map((el) => el.textContent);
    expect(fuLabels.indexOf("40符")).toBeLessThan(fuLabels.indexOf("30符"));
  });

  it("provides a link back to practice", () => {
    renderStats();
    const link = screen.getByRole("link", { name: "練習に戻る" });
    expect(link).toHaveAttribute("href", "/quiz");
  });
});
