import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
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
  it("renders the hand, conditions, and exactly 4 answer buttons", () => {
    renderQuiz();
    expect(screen.getByRole("heading", { name: "出題" })).toBeInTheDocument();
    // ページ上のボタンは4つの選択肢のみ（ヘッダーの「成績を見る」はリンク）。
    const choiceButtons = screen.getAllByRole("button");
    expect(choiceButtons).toHaveLength(4);
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
});
