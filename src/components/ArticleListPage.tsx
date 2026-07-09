import { Link } from "react-router-dom";
import { getAllArticles } from "../content/articles/registry";
import "./articles.css";

export function ArticleListPage() {
  const articles = getAllArticles();

  return (
    <main className="page-shell articles-page">
      <div className="page-header">
        <h1>学習ガイド</h1>
        <div className="page-header-link">
          <Link to="/" className="page-header-link-item">
            ホーム
          </Link>
        </div>
      </div>

      <ul className="article-card-grid">
        {articles.map((article) => (
          <li key={article.slug}>
            <Link to={`/articles/${article.slug}`} className="article-card">
              <span className="article-card-title">{article.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
