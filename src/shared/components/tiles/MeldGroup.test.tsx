import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Meld } from "../../../engine/model";
import { MeldGroup } from "./MeldGroup";

describe("MeldGroup", () => {
  it("renders all tiles of a pon", () => {
    const meld: Meld = {
      type: "pon",
      tiles: [
        { suit: "s", rank: 9 },
        { suit: "s", rank: 9 },
        { suit: "s", rank: 9 },
      ],
    };
    render(<MeldGroup meld={meld} />);
    expect(screen.getAllByRole("img", { name: "九索" })).toHaveLength(3);
  });

  it("renders ankan with the two outer tiles face-down", () => {
    const meld: Meld = {
      type: "ankan",
      tiles: [
        { suit: "m", rank: 1 },
        { suit: "m", rank: 1 },
        { suit: "m", rank: 1 },
        { suit: "m", rank: 1 },
      ],
    };
    render(<MeldGroup meld={meld} />);
    expect(screen.getAllByRole("img", { name: "伏せ牌" })).toHaveLength(2);
    expect(screen.getAllByRole("img", { name: "一萬" })).toHaveLength(2);
  });
});
