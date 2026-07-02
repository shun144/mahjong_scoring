import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TileFace } from "./TileFace";

describe("TileFace", () => {
  it("renders a suited tile with an accessible label", () => {
    render(<TileFace tile={{ suit: "m", rank: 1 }} />);
    expect(screen.getByRole("img", { name: "一萬" })).toBeInTheDocument();
  });

  it("labels a red five distinctly from a normal five", () => {
    render(<TileFace tile={{ suit: "p", rank: 5, red: true }} />);
    expect(screen.getByRole("img", { name: "五筒(赤)" })).toBeInTheDocument();
  });

  it("renders an honor tile by name", () => {
    render(<TileFace tile={{ suit: "z", rank: 6 }} />);
    expect(screen.getByRole("img", { name: "發" })).toBeInTheDocument();
  });

  it("renders a face-down tile with a concealed label", () => {
    render(<TileFace tile={{ suit: "m", rank: 1 }} faceDown />);
    expect(screen.getByRole("img", { name: "伏せ牌" })).toBeInTheDocument();
  });
});
