import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { Problem } from "../data/problem";
import { ResultPage } from "./ResultPage";

function baseProblem(overrides: Partial<Problem["answer"]> = {}): Problem {
  return {
    id: "test-1",
    source: "bank",
    hand: {
      concealed: [],
      melds: [],
      winningTile: { suit: "m", rank: 9 },
      winType: "ron",
    },
    doraIndicators: [{ suit: "s", rank: 4 }],
    uraDoraIndicators: [{ suit: "p", rank: 6 }],
    conditions: { seatWind: "east", roundWind: "east", isDealer: false, riichi: true },
    answer: {
      yaku: [
        { name: "リーチ", han: 1 },
        { name: "平和", han: 1 },
      ],
      han: 2,
      fu: 30,
      payment: { kind: "ron", total: 2000 },
      ...overrides,
    },
    tags: { fuType: 30, yakuCategories: ["リーチ", "平和"] },
  };
}

function renderResult(state: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/result", state }]}>
      <Routes>
        <Route path="/result" element={<ResultPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ResultPage", () => {
  it("shows a fallback message when there is no navigation state", () => {
    renderResult(undefined);
    expect(screen.getByText(/問題データがありません/)).toBeInTheDocument();
  });

  it("shows ○ 正解 and hides 'あなたの回答' when the answer is correct", () => {
    const problem = baseProblem();
    renderResult({ problem, selected: problem.answer.payment, isCorrect: true });

    expect(screen.getByText("○ 正解")).toBeInTheDocument();
    expect(screen.queryByText(/あなたの回答/)).not.toBeInTheDocument();
    expect(screen.getByText("正解: 2000")).toBeInTheDocument();
  });

  it("shows ✕ 不正解 with both the user's answer and the correct answer when wrong", () => {
    const problem = baseProblem();
    renderResult({
      problem,
      selected: { kind: "ron", total: 3900 },
      isCorrect: false,
    });

    expect(screen.getByText("✕ 不正解")).toBeInTheDocument();
    expect(screen.getByText("あなたの回答: 3900")).toBeInTheDocument();
    expect(screen.getByText("正解: 2000")).toBeInTheDocument();
  });

  it("lists every yaku with its han and shows the calculation line", () => {
    const problem = baseProblem();
    renderResult({ problem, selected: problem.answer.payment, isCorrect: true });

    expect(screen.getByText("リーチ")).toBeInTheDocument();
    expect(screen.getByText("平和")).toBeInTheDocument();
    expect(screen.getAllByText("1翻")).toHaveLength(2);
    expect(screen.getByText("30符2翻 (子ロン) → 2000")).toBeInTheDocument();
  });

  it("shows the alternative (高点法) interpretation note when present", () => {
    const problem = baseProblem({
      interpretationNote: "別解: 2翻30符 (2000点相当) という解釈も可能だが、高点法により此方（+1900点）を採用。",
      payment: { kind: "ron", total: 3900 },
      han: 3,
      fu: 30,
    });
    renderResult({ problem, selected: problem.answer.payment, isCorrect: true });

    expect(screen.getByText("高点法の別解")).toBeInTheDocument();
    expect(screen.getByText(/\+1900点/)).toBeInTheDocument();
  });

  it("does not show the alternative interpretation section when there is no runner-up", () => {
    const problem = baseProblem();
    renderResult({ problem, selected: problem.answer.payment, isCorrect: true });
    expect(screen.queryByText("高点法の別解")).not.toBeInTheDocument();
  });

  it("解説にドラ・裏ドラを表示しない", () => {
    const problem = baseProblem();
    renderResult({ problem, selected: problem.answer.payment, isCorrect: true });

    // ドラ表示は解説から撤去済み。実ドラ(五索)・裏ドラ(七筒)のいずれの牌画像も出さない。
    expect(screen.queryByRole("img", { name: "五索" })).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "七筒" })).not.toBeInTheDocument();
  });

  it("provides a link to the next question", () => {
    const problem = baseProblem();
    renderResult({ problem, selected: problem.answer.payment, isCorrect: true });
    const link = screen.getByRole("link", { name: "次の問題へ" });
    expect(link).toHaveAttribute("href", "/quiz");
  });

  it("provides a link back to the same question", () => {
    const problem = baseProblem();
    renderResult({ problem, selected: problem.answer.payment, isCorrect: true });
    const link = screen.getByRole("link", { name: "問題に戻る" });
    expect(link).toHaveAttribute("href", "/quiz");
  });
});
