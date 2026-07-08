import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Problem } from "../data/problem";
import { QuizConditions } from "./QuizConditions";

const conditions: Problem["conditions"] = {
  seatWind: "south",
  roundWind: "east",
  isDealer: false,
  riichi: false,
};

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
});
