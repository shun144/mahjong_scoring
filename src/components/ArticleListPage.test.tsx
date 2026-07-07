import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ArticleListPage } from "./ArticleListPage";

function renderPage() {
  return render(
    <MemoryRouter>
      <ArticleListPage />
    </MemoryRouter>,
  );
}

describe("ArticleListPage", () => {
  it("見出しとホームへの導線を表示する", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "学習ガイド", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ホームに戻る" })).toHaveAttribute("href", "/");
  });

  it("記事一覧に完全ガイドへのリンクを表示する", () => {
    renderPage();
    const link = screen.getByRole("link", {
      name: /麻雀の点数計算 完全ガイド/,
    });
    expect(link).toHaveAttribute("href", "/articles/tensu-keisan-kanzen-guide");
  });
});
