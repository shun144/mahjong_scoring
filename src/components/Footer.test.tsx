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

  it("contentinfo ランドマーク(footer)として提供される", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
