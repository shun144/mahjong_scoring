import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { FuPartsQuizPage } from "./FuPartsQuizPage";

function renderFuParts() {
  return render(
    <MemoryRouter initialEntries={["/fu/parts"]}>
      <Routes>
        <Route path="/fu/parts" element={<FuPartsQuizPage />} />
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
  it("renders the hand, conditions (no dora), element rows, grade button, and nav buttons", () => {
    const { container } = renderFuParts();
    expect(screen.getByRole("heading", { name: "符分解" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "採点する" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "←戻る" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "もう一度" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "次へ→" })).toBeInTheDocument();
    expect(screen.getAllByRole("group").length).toBeGreaterThanOrEqual(1);
    // 符計算・符分解モードはドラに無関係なため、ドラ表示牌の枠は出さない。
    expect(container.querySelector(".dora-indicator-section")).toBeNull();
  });

  it("成績には連携しないため、上部に「成績」リンクを表示しない", () => {
    renderFuParts();
    expect(screen.queryByRole("link", { name: "成績" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ホーム" })).toBeInTheDocument();
  });

  it("never shows a リーチ badge, even across many random problems (符に無関係のため常に非表示)", () => {
    renderFuParts();
    for (let i = 0; i < 30; i++) {
      expect(screen.queryByText("リーチ")).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "次へ→" }));
    }
  });

  it("never shows a 親/子 badge, even across many random problems (符に無関係のため常に非表示)", () => {
    const { container } = renderFuParts();
    for (let i = 0; i < 30; i++) {
      expect(container.querySelector(".badge--dealer")).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "次へ→" }));
    }
  });

  it("採点する is disabled until every row has a selection", () => {
    renderFuParts();
    const gradeBtn = screen.getByRole("button", { name: "採点する" });
    expect(gradeBtn).toBeDisabled();

    selectFirstChoiceInEachRow();
    expect(gradeBtn).not.toBeDisabled();
  });

  it("←戻る is disabled at the first problem, もう一度 is disabled before grading", () => {
    renderFuParts();
    expect(screen.getByRole("button", { name: "←戻る" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "もう一度" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "次へ→" })).not.toBeDisabled();
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
    // 各項目名の右に○/✕のマークだけが出る（正解値は選択肢ボタンの配色で示す）。
    expect(screen.getAllByText(/^○$|^✕$/).length).toBeGreaterThanOrEqual(1);
    // 採点後は「もう一度」が押せるようになる。
    expect(screen.getByRole("button", { name: "もう一度" })).not.toBeDisabled();
  });

  it("次へ→ before grading does not require a selection, and resets the form", () => {
    renderFuParts();
    selectFirstChoiceInEachRow();
    fireEvent.click(screen.getByRole("button", { name: "次へ→" }));

    expect(screen.getByRole("heading", { name: "符分解" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "採点する" })).toBeDisabled();
  });

  it("次へ→ after grading loads a new problem and hides the summary again", () => {
    const { container } = renderFuParts();
    selectFirstChoiceInEachRow();
    fireEvent.click(screen.getByRole("button", { name: "採点する" }));
    expect(container.querySelector(".fu-parts-summary")).toHaveClass(
      "fu-parts-summary--revealed",
    );

    fireEvent.click(screen.getByRole("button", { name: "次へ→" }));
    const summary = container.querySelector(".fu-parts-summary");
    expect(summary).toHaveAttribute("aria-hidden", "true");
    expect(summary).not.toHaveClass("fu-parts-summary--revealed");
    expect(screen.getByRole("button", { name: "採点する" })).toBeDisabled();
  });

  it("←戻る returns to the previous problem after 次へ→, and re-enables at the first problem again", () => {
    renderFuParts();
    const firstLabels = screen.getAllByRole("group").map((g) => g.getAttribute("aria-label"));

    fireEvent.click(screen.getByRole("button", { name: "次へ→" }));
    expect(screen.getByRole("button", { name: "←戻る" })).not.toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "←戻る" }));
    const backLabels = screen.getAllByRole("group").map((g) => g.getAttribute("aria-label"));
    expect(backLabels).toEqual(firstLabels);
    expect(screen.getByRole("button", { name: "←戻る" })).toBeDisabled();
  });

  it("もう一度 keeps the same problem while resetting answers and the summary", () => {
    const { container } = renderFuParts();
    const labelsBefore = screen.getAllByRole("group").map((g) => g.getAttribute("aria-label"));

    selectFirstChoiceInEachRow();
    fireEvent.click(screen.getByRole("button", { name: "採点する" }));
    fireEvent.click(screen.getByRole("button", { name: "もう一度" }));

    const labelsAfter = screen.getAllByRole("group").map((g) => g.getAttribute("aria-label"));
    expect(labelsAfter).toEqual(labelsBefore);
    expect(container.querySelector(".fu-parts-summary")).not.toHaveClass(
      "fu-parts-summary--revealed",
    );
    expect(screen.getByRole("button", { name: "採点する" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "もう一度" })).toBeDisabled();
  });
});
