// 記事本文(md)はファイル本体をそのまま管理する（frontmatterパーサを導入しない最小構成）。
// 新しい記事を追加する際は、このディレクトリに .md を置き、domain/registry.ts の
// ARTICLE_META にエントリを足す。
const bodies = import.meta.glob("./*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

export function bodyFor(slug: string): string {
  const body = bodies[`./${slug}.md`];
  if (body === undefined) {
    throw new Error(`記事本文が見つかりません: ${slug}`);
  }
  return body;
}
