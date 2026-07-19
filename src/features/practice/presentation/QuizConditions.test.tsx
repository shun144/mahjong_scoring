import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Problem } from "../domain/problem";
import { QuizConditions } from "./QuizConditions";

const conditions: Problem["conditions"] = {
  seatWind: "south",
  roundWind: "east",
  isDealer: false,
  riichi: false,
};

const riichiConditions: Problem["conditions"] = { ...conditions, riichi: true };

describe("QuizConditions", () => {
  it("roundUpManganを渡さない場合は「満貫切上」タグを表示しない", () => {
    render(<QuizConditions conditions={conditions} />);
    expect(screen.queryByText("満貫切上")).not.toBeInTheDocument();
  });

  it("roundUpMangan=falseの場合も「満貫切上」タグを表示しない", () => {
    render(<QuizConditions conditions={conditions} roundUpMangan={false} />);
    expect(screen.queryByText("満貫切上")).not.toBeInTheDocument();
  });

  it("roundUpMangan=trueの場合、条件タグの先頭に「満貫切上」を表示する", () => {
    const { container } = render(<QuizConditions conditions={conditions} roundUpMangan={true} />);
    expect(screen.getByText("満貫切上")).toBeInTheDocument();

    const section = container.querySelector(".quiz-conditions");
    const firstBadgeText = section?.firstElementChild?.textContent;
    expect(firstBadgeText).toBe("満貫切上");
  });

  it("リーチの問題では既定（showRiichi未指定）で「リーチ」タグを表示する", () => {
    render(<QuizConditions conditions={riichiConditions} />);
    expect(screen.getByText("リーチ")).toBeInTheDocument();
  });

  it("showRiichi=falseの場合、リーチの問題でも「リーチ」タグを表示しない（符分解モード用）", () => {
    render(<QuizConditions conditions={riichiConditions} showRiichi={false} />);
    expect(screen.queryByText("リーチ")).not.toBeInTheDocument();
  });

  it("showRiichi=falseでも、リーチでない問題は元々「リーチ」タグを表示しない", () => {
    render(<QuizConditions conditions={conditions} showRiichi={false} />);
    expect(screen.queryByText("リーチ")).not.toBeInTheDocument();
  });

  it("既定（showDealer未指定）で「親/子」タグを表示する", () => {
    const { container } = render(<QuizConditions conditions={conditions} />);
    expect(container.querySelector(".badge--dealer")).not.toBeNull();
  });

  it("showDealer=falseの場合、「親/子」タグを表示しない（符分解モード用）", () => {
    const { container } = render(<QuizConditions conditions={conditions} showDealer={false} />);
    expect(container.querySelector(".badge--dealer")).toBeNull();
  });
});
