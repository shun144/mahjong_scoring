import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";

// クイズ/ホームなど、記事から実際に遷移してよいアプリ内ルート。
// 未作成の記事(スラッグ)を除き、これ以外の内部パスはリンクとして扱わずテキスト化する。
const INTERNAL_ROUTES = new Set(["/", "/quiz", "/fu/quiz", "/stats", "/articles"]);

type LinkKind = "route" | "external" | "text";

function resolveLinkKind(href: string, articleSlugs: readonly string[]): LinkKind {
  if (/^https?:\/\//.test(href)) return "external";
  if (INTERNAL_ROUTES.has(href)) return "route";
  if (articleSlugs.some((slug) => href === `/articles/${slug}`)) return "route";
  return "text";
}

interface ArticleMarkdownProps {
  markdown: string;
  articleSlugs: readonly string[];
}

/**
 * 記事Markdownの描画。
 * - 画像はプレースホルダ枠に置換する(実画像は未調達のため)。
 * - リンクは、実在するアプリ内ルートのみ<Link>として生かし、それ以外(未作成の
 *   子記事へのリンク等)はテキスト化して404遷移を防ぐ。外部リンクは新規タブで開く。
 */
export function ArticleMarkdown({ markdown, articleSlugs }: ArticleMarkdownProps) {
  const components: Components = {
    img({ alt, src }) {
      return (
        <span className="article-image-placeholder" role="img" aria-label={alt ?? "画像"}>
          <img className="article-image-placeholder-img" src={src} alt={alt} />
        </span>
      );
    },
    p({ node, children }) {
      const soleChild = node?.children.length === 1 ? node.children[0] : undefined;
      const isImageCaption = soleChild?.type === "element" && soleChild.tagName === "em";
      return <p className={isImageCaption ? "article-image-caption" : undefined}>{children}</p>;
    },
    table({ children }) {
      return (
        <div className="article-table-wrap">
          <table>{children}</table>
        </div>
      );
    },
    a({ href, children }) {
      const kind = href ? resolveLinkKind(href, articleSlugs) : "text";
      if (kind === "route" && href) {
        return (
          <Link to={href} className="article-link">
            {children}
          </Link>
        );
      }
      if (kind === "external" && href) {
        return (
          <a href={href} target="_blank" rel="noopener noreferrer" className="article-link">
            {children}
          </a>
        );
      }
      return <span className="article-link-disabled">{children}</span>;
    },
  };

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {markdown}
    </ReactMarkdown>
  );
}
