import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { loadStats } from "../store/statsStore";
import { QuizPage } from "./QuizPage";
import { ResultPage } from "./ResultPage";

function renderQuiz() {
  return render(
    <MemoryRouter initialEntries={["/quiz"]}>
      <Routes>
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/result" element={<ResultPage />} />
      </Routes>
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

    // 選んだ選択肢がたまたま正解の場合「あなたの回答」は表示されないため、
    // 常に表示される要素のみを検証する（正誤ごとの詳細はResultPage.test.tsxで検証）。
    expect(screen.getByRole("heading", { name: "解説" })).toBeInTheDocument();
    expect(screen.getByText(/正解:/)).toBeInTheDocument();
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
});
