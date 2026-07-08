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

      <ul className="article-list">
        {articles.map((article) => (
          <li key={article.slug}>
            <Link to={`/articles/${article.slug}`} className="article-list-item">
              <span className="article-list-title">{article.title}</span>
              <span className="article-list-desc">{article.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
