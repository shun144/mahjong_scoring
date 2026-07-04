import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { loadStats } from "../store/statsStore";
import { FuQuizPage } from "./FuQuizPage";
import { FuResultPage } from "./FuResultPage";

function renderFuQuiz() {
  return render(
    <MemoryRouter initialEntries={["/fu/quiz"]}>
      <Routes>
        <Route path="/fu/quiz" element={<FuQuizPage />} />
        <Route path="/fu/result" element={<FuResultPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("FuQuizPage", () => {
  it("renders the hand, conditions, 4 fu choices, and a skip button", () => {
    renderFuQuiz();
    expect(screen.getByRole("heading", { name: "符計算" })).toBeInTheDocument();
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(5);
    expect(screen.getByRole("button", { name: "次の問題へ" })).toBeInTheDocument();
  });

  it("navigates to the fu result page immediately when a choice is clicked", () => {
    renderFuQuiz();
    const choiceButtons = screen
      .getAllByRole("button")
      .filter((b) => b.textContent?.endsWith("符"));
    fireEvent.click(choiceButtons[0]);

    expect(screen.getByRole("heading", { name: "解説" })).toBeInTheDocument();
    expect(screen.getByText(/正解:/)).toBeInTheDocument();
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
    renderFuQuiz();
    fireEvent.click(screen.getByRole("button", { name: "次の問題へ" }));
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });
});
