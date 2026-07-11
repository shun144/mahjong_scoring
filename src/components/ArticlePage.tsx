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

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getArticleBySlug(slug) : undefined;
  const articleSlugs = getAllArticles().map((a) => a.slug);

  useArticleMeta(article?.title, undefined);

  if (!article) {
    return <Navigate to="/articles" replace />;
  }

  return (
    <main className="page-shell article-page">
      <nav className="article-topnav" aria-label="記事ナビゲーション">
        <Link to="/articles" className="page-header-link-item">
          記事一覧に戻る
        </Link>
        <Link to="/" className="page-header-link-item">
          ホーム
        </Link>
      </nav>

      <article className="article-body">
        <ArticleMarkdown markdown={article.body} articleSlugs={articleSlugs} />
      </article>

      <div className="article-end-cta">
        <Link to="/quiz" className="btn-primary">
          点数計算モードを試す
        </Link>
      </div>
    </main>
  );
}
