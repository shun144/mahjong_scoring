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
    expect(screen.getByRole("heading", { name: "麻雀点数トレーニング" })).toBeInTheDocument();
  });

  it("renders the quiz page at /quiz", () => {
    render(
      <MemoryRouter initialEntries={["/quiz"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "出題" })).toBeInTheDocument();
  });

  it("renders the article list page at /articles", () => {
    render(
      <MemoryRouter initialEntries={["/articles"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "学習ガイド" })).toBeInTheDocument();
  });

  it("renders an article at /articles/:slug", () => {
    render(
      <MemoryRouter initialEntries={["/articles/tensu-keisan-guide"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: /麻雀の点数計算ガイド/ })).toBeInTheDocument();
  });
});
