import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { loadStats } from "../store/statsStore";
import { FuPartsQuizPage } from "./FuPartsQuizPage";
import { StatsPage } from "./StatsPage";

function renderFuParts() {
  return render(
    <MemoryRouter initialEntries={["/fu/parts"]}>
      <Routes>
        <Route path="/fu/parts" element={<FuPartsQuizPage />} />
        <Route path="/stats" element={<StatsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

/** 各要素グループ（役割問わず）から先頭の選択肢を選び、フォームを完答状態にする。 */
function selectFirstChoiceInEachRow() {
  const groups = screen.getAllByRole("group");
  for (const group of groups) {
    fireEvent.click(within(group).getAllByRole("button")[0]);
  }
  return groups;
}

describe("FuPartsQuizPage", () => {
  it("renders the hand, conditions (no dora), element rows, grade button, and skip button", () => {
    const { container } = renderFuParts();
    expect(screen.getByRole("heading", { name: "符分解" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "採点する" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "次の問題へ" })).toBeInTheDocument();
    expect(screen.getAllByRole("group").length).toBeGreaterThanOrEqual(1);
    // 符計算・符分解モードはドラに無関係なため、ドラ表示牌の枠は出さない。
    expect(container.querySelector(".dora-indicator-section")).toBeNull();
  });

  it("never shows a リーチ badge, even across many random problems (符に無関係のため常に非表示)", () => {
    renderFuParts();
    for (let i = 0; i < 30; i++) {
      expect(screen.queryByText("リーチ")).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "次の問題へ" }));
    }
  });

  it("採点する is disabled until every row has a selection", () => {
    renderFuParts();
    const gradeBtn = screen.getByRole("button", { name: "採点する" });
    expect(gradeBtn).toBeDisabled();

    selectFirstChoiceInEachRow();
    expect(gradeBtn).not.toBeDisabled();
  });

  it("grading reveals per-row verdicts and the summary, and disables further grading", () => {
    const { container } = renderFuParts();
    const summary = container.querySelector(".fu-parts-summary");
    expect(summary).toHaveAttribute("aria-hidden", "true");
    expect(summary).not.toHaveClass("fu-parts-summary--revealed");

    selectFirstChoiceInEachRow();
    fireEvent.click(screen.getByRole("button", { name: "採点する" }));

    expect(screen.getByRole("button", { name: "採点する" })).toBeDisabled();
    expect(summary).toHaveAttribute("aria-hidden", "false");
    expect(summary).toHaveClass("fu-parts-summary--revealed");
    expect(summary?.textContent).toMatch(/○ 完答|✕ 一部不正解/);
    // 各項目名の上に○/✕のマークだけが出る（正解値は選択肢ボタンの配色で示す）。
    expect(screen.getAllByText(/^○$|^✕$/).length).toBeGreaterThanOrEqual(1);
  });

  it("grading records exactly one answer (correct or not)", () => {
    localStorage.clear();
    renderFuParts();
    const before = loadStats().totalAnswered;

    selectFirstChoiceInEachRow();
    fireEvent.click(screen.getByRole("button", { name: "採点する" }));

    expect(loadStats().totalAnswered).toBe(before + 1);
  });

  it("skipping before grading does not record an answer, and resets the form", () => {
    localStorage.clear();
    renderFuParts();
    const before = loadStats().totalAnswered;

    selectFirstChoiceInEachRow();
    fireEvent.click(screen.getByRole("button", { name: "次の問題へ" }));

    expect(loadStats().totalAnswered).toBe(before);
    expect(screen.getByRole("heading", { name: "符分解" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "採点する" })).toBeDisabled();
  });

  it("次の問題へ after grading loads a new problem and hides the summary again", () => {
    const { container } = renderFuParts();
    selectFirstChoiceInEachRow();
    fireEvent.click(screen.getByRole("button", { name: "採点する" }));
    expect(container.querySelector(".fu-parts-summary")).toHaveClass(
      "fu-parts-summary--revealed",
    );

    fireEvent.click(screen.getByRole("button", { name: "次の問題へ" }));
    const summary = container.querySelector(".fu-parts-summary");
    expect(summary).toHaveAttribute("aria-hidden", "true");
    expect(summary).not.toHaveClass("fu-parts-summary--revealed");
    expect(screen.getByRole("button", { name: "採点する" })).toBeDisabled();
  });

  it("returns to the fu-parts page (not another quiz page) after viewing stats", () => {
    renderFuParts();
    fireEvent.click(screen.getByRole("link", { name: "成績" }));
    expect(screen.getByRole("heading", { name: "成績" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "練習に戻る" }));
    expect(screen.getByRole("heading", { name: "符分解" })).toBeInTheDocument();
  });

  it("keeps the same problem (same element groups) after a stats round trip", () => {
    renderFuParts();
    const labelsBefore = screen.getAllByRole("group").map((g) => g.getAttribute("aria-label"));

    fireEvent.click(screen.getByRole("link", { name: "成績" }));
    fireEvent.click(screen.getByRole("link", { name: "練習に戻る" }));

    const labelsAfter = screen.getAllByRole("group").map((g) => g.getAttribute("aria-label"));
    expect(labelsAfter).toEqual(labelsBefore);
  });
});
