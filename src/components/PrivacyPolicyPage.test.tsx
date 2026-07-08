import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { PrivacyPolicyPage } from "./PrivacyPolicyPage";

function renderPage() {
  return render(
    <MemoryRouter>
      <PrivacyPolicyPage />
    </MemoryRouter>,
  );
}

describe("PrivacyPolicyPage", () => {
  it("プライバシーポリシーの見出しとホームへの導線を表示する", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: "プライバシーポリシー", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ホーム" })).toHaveAttribute("href", "/");
  });

  it("広告掲載が目的のため、広告配信の説明とオプトアウト導線を含む", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /広告の配信について/ })).toBeInTheDocument();
    // 第三者配信のオプトアウト導線（Google 広告設定）を提示する。
    expect(screen.getByRole("link", { name: "広告設定ページ" })).toHaveAttribute(
      "href",
      "https://adssettings.google.com/",
    );
  });

  it("お問い合わせフォーム(Google フォーム)へのリンクを表示する", () => {
    renderPage();
    expect(screen.getByRole("link", { name: "お問い合わせフォームを開く" })).toHaveAttribute(
      "href",
      "https://docs.google.com/forms/d/e/1FAIpQLSfFnI4zqQTGDRO5ae4rxI5P8c2CkAx99UE9be1Sw4gQCxxoCA/viewform",
    );
  });
});
