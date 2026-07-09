export interface ArticleMeta {
  slug: string;
  title: string;
  publishedAt: string; // YYYY-MM-DD
  order: number;
}

export interface Article extends ArticleMeta {
  body: string;
}

// 記事本文(md)はファイル本体をそのまま管理し、メタ情報だけここで持つ
// （frontmatterパーサを導入しない最小構成）。新しい記事を追加する際は
// このディレクトリに .md を置き、下の ARTICLE_META にエントリを足す。
const bodies = import.meta.glob("./*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

function bodyFor(slug: string): string {
  const body = bodies[`./${slug}.md`];
  if (body === undefined) {
    throw new Error(`記事本文が見つかりません: ${slug}`);
  }
  return body;
}

const ARTICLE_META: ArticleMeta[] = [
  {
    slug: "tensu-keisan-guide",
    title: "点数計算ガイド",
    publishedAt: "2026-07-07",
    order: 1,
  },
  {
    slug: "mahjong-yougoshu",
    title: "基本用語集",
    publishedAt: "2026-07-08",
    order: 2,
  },
  {
    slug: "mahjong-one-round-flow",
    title: "1局の流れ",

    publishedAt: "2026-07-09",
    order: 3,
  },
];

export function getAllArticles(): Article[] {
  return [...ARTICLE_META]
    .sort((a, b) => a.order - b.order)
    .map((meta) => ({ ...meta, body: bodyFor(meta.slug) }));
}

export function getArticleBySlug(slug: string): Article | undefined {
  const meta = ARTICLE_META.find((m) => m.slug === slug);
  if (!meta) return undefined;
  return { ...meta, body: bodyFor(meta.slug) };
}
