import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { RouteMeta } from "./RouteMeta";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <RouteMeta />
    </MemoryRouter>,
  );
}

function canonicalHref(): string | null {
  return document.head.querySelector("link[rel='canonical']")?.getAttribute("href") ?? null;
}

function robotsContent(): string | null {
  return document.head.querySelector("meta[name='robots']")?.getAttribute("content") ?? null;
}

function descriptionContent(): string | null {
  return document.head.querySelector("meta[name='description']")?.getAttribute("content") ?? null;
}

describe("RouteMeta", () => {
  it("トップページのtitleとcanonicalを出力する", async () => {
    renderAt("/");
    await waitFor(() => expect(document.title).toContain("麻雀点数トレーニング"));
    expect(canonicalHref()).toBe("https://mahjongtensu.com/");
    expect(robotsContent()).toBeNull();
  });

  it("固定ルートはページ固有のtitleとcanonicalを出力する", async () => {
    renderAt("/contact");
    await waitFor(() => expect(document.title).toBe("お問い合わせ｜麻雀点数トレーニング"));
    expect(canonicalHref()).toBe("https://mahjongtensu.com/contact");
    expect(descriptionContent()).not.toBeNull();
  });

  it("記事ページはregistryのタイトル・説明からメタを生成する", async () => {
    renderAt("/articles/mahjong-yaku-list");
    await waitFor(() => expect(document.title).toBe("役一覧｜麻雀点数トレーニング"));
    expect(canonicalHref()).toBe("https://mahjongtensu.com/articles/mahjong-yaku-list");
  });

  it("インデックス対象外ページはnoindexとしcanonicalを出さない", async () => {
    renderAt("/stats");
    await waitFor(() => expect(document.title).toBe("成績｜麻雀点数トレーニング"));
    expect(robotsContent()).toBe("noindex");
    expect(canonicalHref()).toBeNull();
  });
});
