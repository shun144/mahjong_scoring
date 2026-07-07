import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ArticleMarkdown } from "./ArticleMarkdown";

function renderMarkdown(markdown: string, articleSlugs: string[] = []) {
  return render(
    <MemoryRouter>
      <ArticleMarkdown markdown={markdown} articleSlugs={articleSlugs} />
    </MemoryRouter>,
  );
}

describe("ArticleMarkdown", () => {
  it("既知のアプリ内ルート(/)へのリンクは実際に遷移するリンクとして描画する", () => {
    renderMarkdown("[点数計算ツール](/)");
    const link = screen.getByRole("link", { name: "点数計算ツール" });
    expect(link).toHaveAttribute("href", "/");
  });

  it("存在する記事slugへのリンクはリンクとして描画する", () => {
    renderMarkdown("[別記事](/articles/another-guide)", ["another-guide"]);
    const link = screen.getByRole("link", { name: "別記事" });
    expect(link).toHaveAttribute("href", "/articles/another-guide");
  });

  it("未作成の子記事など、実在しない内部パスへのリンクはリンク化せずテキストのまま表示する", () => {
    renderMarkdown("[符計算のやり方](/articles/fu-keisan)");
    expect(screen.queryByRole("link", { name: "符計算のやり方" })).not.toBeInTheDocument();
    expect(screen.getByText("符計算のやり方")).toBeInTheDocument();
  });

  it("外部リンクは新規タブで開く属性を付与する", () => {
    renderMarkdown("[外部サイト](https://example.com/)");
    const link = screen.getByRole("link", { name: "外部サイト" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("画像は実画像を読み込まずプレースホルダ枠(altをaccessible nameに持つ)として描画する", () => {
    const { container } = renderMarkdown("![符→翻→点数の3ステップ図](images/three-steps.png)");
    expect(
      screen.getByRole("img", { name: "符→翻→点数の3ステップ図" }),
    ).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });
});
