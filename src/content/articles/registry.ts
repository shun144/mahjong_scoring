export interface ArticleMeta {
  slug: string;
  title: string;
  description: string; // meta description用。記事ごとに固有の要約(SEO対策)
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
    description:
      "麻雀の点数計算の全体像を解説。符を数える→翻を数える→点数に変える、の3ステップを具体例つきでやさしく紹介します。",
    publishedAt: "2026-07-07",
    order: 1,
  },
  {
    slug: "mahjong-yougoshu",
    title: "基本用語集",
    description:
      "萬子・筒子・索子・字牌、自風牌・場風牌など、点数計算の理解に欠かせない麻雀の基本用語をやさしく解説します。",
    publishedAt: "2026-07-08",
    order: 2,
  },
  {
    slug: "mahjong-one-round-flow",
    title: "1局の流れ",
    description:
      "席決め・配牌からツモと打牌の繰り返し、和了・流局までを順番に解説。麻雀の1局の流れを初心者向けに紹介します。",
    publishedAt: "2026-07-09",
    order: 3,
  },
  {
    slug: "mahjong-yaku-list",
    title: "役一覧",
    description:
      "麻雀の役を翻数別に紹介。牌姿つきで成立条件・よくある勘違い・具体例を解説します。",
    publishedAt: "2026-07-13",
    order: 4,
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
