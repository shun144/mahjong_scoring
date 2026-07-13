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
    // 見出し内でキーワードをマーカー強調する <span> によりアクセシブルネームに空白が入るため、
    // 空白を許容する正規表現で照合する。
    expect(
      screen.getByRole("heading", { name: /和了形から\s*点数\s*を当てる/ }),
    ).toBeInTheDocument();
  });

  it("renders the quiz page at /quiz", () => {
    render(
      <MemoryRouter initialEntries={["/quiz"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "点数計算" })).toBeInTheDocument();
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

  it("renders the settings page at /settings", () => {
    render(
      <MemoryRouter initialEntries={["/settings"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "設定" })).toBeInTheDocument();
  });
});
