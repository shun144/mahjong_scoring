import "@testing-library/jest-dom/vitest";

// jsdom のドキュメントには index.html の <meta name="description"> が無いため、
// 本番と同じ内容で用意する(記事ページ等のメタ description 切替テストに必要)。
if (!document.querySelector('meta[name="description"]')) {
  const meta = document.createElement("meta");
  meta.setAttribute("name", "description");
  meta.setAttribute("content", "麻雀の点数計算(符・翻・点数)をスマホで反復練習できるドリルアプリ。");
  document.head.appendChild(meta);
}
