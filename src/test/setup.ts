import "@testing-library/jest-dom/vitest";

// jsdom のドキュメントには index.html の <meta name="description"> が無いため、
// 本番と同じ内容で用意する(記事ページ等のメタ description 切替テストに必要)。
if (!document.querySelector('meta[name="description"]')) {
  const meta = document.createElement("meta");
  meta.setAttribute("name", "description");
  meta.setAttribute(
    "content",
    "麻雀の点数計算(符・翻・点数)をスマホで反復練習できるドリルアプリ。",
  );
  document.head.appendChild(meta);
}

// jsdom は IntersectionObserver を実装していない（レイアウト計算を行わないため）。
// ScoreTableDialog 等がマウント時に生成するだけで、可視判定の挙動を検証しないテストが
// クラッシュしないよう、no-op のポリフィルを用意する。可視判定を検証するテストは
// 個別にこのグローバルを差し替える(vi.stubGlobal)。
if (typeof globalThis.IntersectionObserver === "undefined") {
  class NoopIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = "";
    readonly thresholds: ReadonlyArray<number> = [];
    readonly scrollMargin: string = "";
    // callback/options は使わない（可視判定を検証するテストは vi.stubGlobal で差し替える）。
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  globalThis.IntersectionObserver =
    NoopIntersectionObserver as unknown as typeof IntersectionObserver;
}

// jsdom は ResizeObserver も実装していない。HandDisplay の横スクロールフェード表示等、
// 要素サイズ変化を監視するだけで実際のレイアウト計算結果を検証しないテストが
// クラッシュしないよう、no-op のポリフィルを用意する。
if (typeof globalThis.ResizeObserver === "undefined") {
  class NoopResizeObserver implements ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = NoopResizeObserver as unknown as typeof ResizeObserver;
}
