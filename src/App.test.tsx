import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App routing", () => {
  it("renders the home page at /", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: "麻雀 点数計算ドリル" }),
    ).toBeInTheDocument();
  });

  it("renders the quiz page at /quiz", () => {
    render(
      <MemoryRouter initialEntries={["/quiz"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "出題" })).toBeInTheDocument();
  });
});
