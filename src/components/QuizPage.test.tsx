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
  it("renders the hand, conditions, and an answer select with multiple options", () => {
    renderQuiz();
    expect(screen.getByRole("heading", { name: "出題" })).toBeInTheDocument();
    const select = screen.getByLabelText("点数を選択してください") as HTMLSelectElement;
    // 「選択してください」プレースホルダー + 4〜8個の選択肢
    expect(select.options.length).toBeGreaterThanOrEqual(5);
    expect(select.options.length).toBeLessThanOrEqual(9);
  });

  it("disables the submit button until an answer is selected", () => {
    renderQuiz();
    const button = screen.getByRole("button", { name: "回答する" });
    expect(button).toBeDisabled();

    const select = screen.getByLabelText("点数を選択してください") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "1" } });
    expect(button).not.toBeDisabled();
  });

  it("navigates to the result page with the selected answer on submit", () => {
    renderQuiz();
    const select = screen.getByLabelText("点数を選択してください") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "回答する" }));

    // 選んだ選択肢がたまたま正解の場合「あなたの回答」は表示されないため、
    // 常に表示される要素のみを検証する（正誤ごとの詳細はResultPage.test.tsxで検証）。
    expect(screen.getByRole("heading", { name: "解説" })).toBeInTheDocument();
    expect(screen.getByText(/正解:/)).toBeInTheDocument();
  });
});
