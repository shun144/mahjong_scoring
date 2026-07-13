import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ArticleListPage } from "./ArticleListPage";
import { ArticlePage } from "./ArticlePage";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/articles" element={<ArticleListPage />} />
        <Route path="/articles/:slug" element={<ArticlePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ArticlePage", () => {
  it("既存記事の本文とタイトルを表示する", () => {
    renderAt("/articles/tensu-keisan-guide");
    expect(
      screen.getByRole("heading", {
        name: "麻雀の点数計算ガイド｜符・翻から点数を出す流れ",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/基本点 = 符/)).toBeInTheDocument();
  });

  it("document.titleを記事タイトルベースに設定する", () => {
    renderAt("/articles/tensu-keisan-guide");
    expect(document.title).toContain("数計算ガイド｜麻雀点数トレーニング");
  });

  it("meta descriptionを記事ごとの専用説明文に設定する", () => {
    renderAt("/articles/tensu-keisan-guide");
    const meta = document.querySelector('meta[name="description"]');
    expect(meta?.getAttribute("content")).toContain("符を数える");
  });

  it("記事内の画像はすべてプレースホルダ枠として表示する", () => {
    renderAt("/articles/tensu-keisan-guide");
    expect(screen.getAllByRole("img").length).toBe(5);
  });

  it("末尾にクイズへ戻るCTAを表示する", () => {
    renderAt("/articles/tensu-keisan-guide");
    expect(screen.getByRole("link", { name: "点数計算モードを試す" })).toHaveAttribute(
      "href",
      "/quiz",
    );
  });

  it("存在しないslugは記事一覧にリダイレクトする", () => {
    renderAt("/articles/does-not-exist");
    expect(screen.getByRole("heading", { name: "学習ガイド", level: 1 })).toBeInTheDocument();
  });
});
