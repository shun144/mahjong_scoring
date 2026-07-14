import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { OPERATOR_NAME } from "../config/site";
import { AboutPage } from "./AboutPage";

function renderPage() {
  return render(
    <MemoryRouter>
      <AboutPage />
    </MemoryRouter>,
  );
}

describe("AboutPage", () => {
  it("運営者情報の見出しとホームへの導線を表示する", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "運営者情報", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ホーム" })).toHaveAttribute("href", "/");
  });

  it("運営者名義(ハンドルネーム)を表示する", () => {
    renderPage();
    expect(screen.getByText(new RegExp(OPERATOR_NAME))).toBeInTheDocument();
  });

  it("広告掲載を明記し、プライバシーポリシーへのリンクを含む", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "広告について" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "プライバシーポリシー" })).toHaveAttribute(
      "href",
      "/privacy",
    );
  });

  it("免責事項を表示する", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "免責事項" })).toBeInTheDocument();
  });

  it("お問い合わせページへの内部リンクを表示する", () => {
    renderPage();
    expect(screen.getByRole("link", { name: "お問い合わせページ" })).toHaveAttribute(
      "href",
      "/contact",
    );
  });

  it("提供コンテンツの各ツールへの内部リンクを表示する", () => {
    renderPage();
    expect(screen.getByRole("link", { name: "点数計算モード" })).toHaveAttribute("href", "/quiz");
    expect(screen.getByRole("link", { name: "符計算モード" })).toHaveAttribute("href", "/fu/quiz");
    expect(screen.getByRole("link", { name: "符分解モード" })).toHaveAttribute(
      "href",
      "/fu/parts",
    );
    expect(screen.getByRole("link", { name: "点数換算モード" })).toHaveAttribute(
      "href",
      "/convert",
    );
    expect(screen.getByRole("link", { name: "学習ガイド" })).toHaveAttribute("href", "/articles");
  });
});
