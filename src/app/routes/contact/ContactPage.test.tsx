import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { CONTACT_FORM_URL } from "../../site";
import { ContactPage } from "./ContactPage";

function renderPage() {
  return render(
    <MemoryRouter>
      <ContactPage />
    </MemoryRouter>,
  );
}

describe("ContactPage", () => {
  it("お問い合わせの見出しとホームへの導線を表示する", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "お問い合わせ", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ホーム" })).toHaveAttribute("href", "/");
  });

  it("お問い合わせフォーム(Googleフォーム)へのリンクを表示する", () => {
    renderPage();
    expect(screen.getByRole("link", { name: "お問い合わせフォームを開く" })).toHaveAttribute(
      "href",
      CONTACT_FORM_URL,
    );
  });

  it("プライバシーポリシーへの内部リンクを表示する", () => {
    renderPage();
    expect(screen.getByRole("link", { name: "プライバシーポリシー" })).toHaveAttribute(
      "href",
      "/privacy",
    );
  });
});
