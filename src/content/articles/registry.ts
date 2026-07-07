export interface ArticleMeta {
  slug: string;
  title: string;
  description: string;
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
    slug: "tensu-keisan-kanzen-guide",
    title: "麻雀の点数計算 完全ガイド｜符・翻から点数を出す流れ",
    description:
      "符・翻・点数の関係を3ステップで解説。符の数え方、翻の数え方、点数への変換、満貫以上の区切りまで一気に把握できる麻雀点数計算の入門ガイド。",
    publishedAt: "2026-07-07",
    order: 1,
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
