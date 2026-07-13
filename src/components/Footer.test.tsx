import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { Footer } from "./Footer";

describe("Footer", () => {
  it("プライバシーポリシーへのリンクを表示する", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    const link = screen.getByRole("link", { name: "プライバシーポリシー" });
    expect(link).toHaveAttribute("href", "/privacy");
  });

  it("学習ガイドへのリンクを表示する", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    const link = screen.getByRole("link", { name: "学習ガイド" });
    expect(link).toHaveAttribute("href", "/articles");
  });

  it("運営者情報へのリンクを表示する", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    const link = screen.getByRole("link", { name: "運営者情報" });
    expect(link).toHaveAttribute("href", "/about");
  });

  it("contentinfo ランドマーク(footer)として提供される", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
