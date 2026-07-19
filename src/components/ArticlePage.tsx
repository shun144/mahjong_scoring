import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArticleMarkdown } from "./articles/ArticleMarkdown";
import { getAllArticles, getArticleBySlug } from "../content/articles/registry";
import "./articles.css";

const SITE_NAME = "麻雀点数トレーニング";

function useArticleMeta(title: string | undefined, description: string | undefined) {
  useEffect(() => {
    if (!title || !description) return;

    const prevTitle = document.title;
    document.title = `${title}｜${SITE_NAME}`;

    const meta = document.querySelector('meta[name="description"]');
    const prevDescription = meta?.getAttribute("content") ?? null;
    meta?.setAttribute("content", description);

    return () => {
      document.title = prevTitle;
      if (meta && prevDescription !== null) {
        meta.setAttribute("content", prevDescription);
      }
    };
  }, [title, description]);
}

const TOPNAV_LINK_CLASS =
  "inline-flex items-center min-h-[36px] px-[14px] text-[0.8rem] font-bold text-fl-teal-dark no-underline bg-fl-cream border-2 border-fl-teal rounded-[var(--fl-r-pill)] transition-[transform,background,color] duration-[var(--fl-dur)] ease-[var(--fl-bounce)] hover:text-fl-cream hover:bg-fl-teal hover:no-underline hover:-translate-y-0.5 active:scale-95 motion-reduce:transition-none motion-reduce:transform-none";

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getArticleBySlug(slug) : undefined;
  const articleSlugs = getAllArticles().map((a) => a.slug);

  useArticleMeta(article?.title, article?.description);

  if (!article) {
    return <Navigate to="/articles" replace />;
  }

  return (
    <main className="page-shell article-page">
      <nav
        className="sticky top-0 z-10 flex items-center gap-2 mx-[calc(50%-50vw)] mt-[calc(-1*var(--space-4))] sm:mt-[calc(-1*var(--space-6))] px-[max(16px,calc(50vw-320px))] py-[10px] bg-[rgba(255,248,231,0.86)] backdrop-blur-[10px] [-webkit-backdrop-filter:blur(10px)] border-b-2 border-[rgba(43,168,162,0.22)]"
        aria-label="記事ナビゲーション"
      >
        <Link to="/articles" className={TOPNAV_LINK_CLASS}>
          記事一覧に戻る
        </Link>
        <Link to="/" className={TOPNAV_LINK_CLASS}>
          ホーム
        </Link>
      </nav>

      <article className="flex flex-col gap-[var(--space-4)] py-[22px] px-5 bg-fl-card border-2 border-[rgba(43,168,162,0.22)] rounded-[var(--fl-r-lg)] shadow-[var(--fl-glow-teal-soft)] leading-[var(--leading-normal)] text-fl-body">
        <ArticleMarkdown markdown={article.body} articleSlugs={articleSlugs} />
      </article>

      <div className="flex justify-center pt-[var(--space-3)]">
        <Link
          to="/quiz"
          className="relative overflow-hidden inline-flex items-center justify-center min-h-[54px] px-7 font-extrabold text-fl-ink no-underline bg-[linear-gradient(180deg,var(--color-fl-gold-light)_0%,var(--color-fl-gold)_100%)] rounded-[var(--fl-r-pill)] shadow-[var(--fl-glow-gold)] transition-[transform,box-shadow] duration-[var(--fl-dur)] ease-[var(--fl-bounce)] hover:shadow-[0_12px_28px_rgba(255,210,63,0.5)] hover:-translate-y-0.5 active:scale-[0.96] motion-reduce:transition-none motion-reduce:transform-none"
        >
          <span
            aria-hidden="true"
            className="absolute top-0 right-0 left-0 bottom-[52%] bg-[linear-gradient(180deg,rgba(255,255,255,0.55),transparent)] rounded-t-[var(--fl-r-pill)] rounded-b-[40%] pointer-events-none"
          />
          点数計算モードを試す
        </Link>
      </div>
    </main>
  );
}
