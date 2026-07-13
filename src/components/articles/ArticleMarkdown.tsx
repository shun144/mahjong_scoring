import { useEffect, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";
import { parseHandNotation } from "../../content/articles/handNotation";
import { ArticleHand } from "./ArticleHand";

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

interface LightboxImage {
  src: string;
  alt: string;
}

/**
 * 記事Markdownの描画。
 * - 画像はクリックで拡大表示(ライトボックス)する。
 * - リンクは、実在するアプリ内ルートのみ<Link>として生かし、それ以外(未作成の
 *   子記事へのリンク等)はテキスト化して404遷移を防ぐ。外部リンクは新規タブで開く。
 */
export function ArticleMarkdown({ markdown, articleSlugs }: ArticleMarkdownProps) {
  const [lightboxImage, setLightboxImage] = useState<LightboxImage | null>(null);

  useEffect(() => {
    if (!lightboxImage) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxImage(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [lightboxImage]);

  const components: Components = {
    img({ alt, src }) {
      if (!src) return null;
      const altText = alt ?? "画像";
      return (
        <button
          type="button"
          className="article-image-trigger"
          onClick={() => setLightboxImage({ src, alt: altText })}
        >
          <img className="article-image-placeholder-img" src={src} alt={altText} />
        </button>
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
    pre({ node, children }) {
      const soleChild = node?.children.length === 1 ? node.children[0] : undefined;
      if (soleChild?.type === "element" && soleChild.tagName === "code") {
        const classProp = soleChild.properties?.className;
        const classNames = Array.isArray(classProp) ? classProp.map(String) : [];
        if (classNames.includes("language-mahjong")) {
          const textNode = soleChild.children[0];
          const raw = textNode?.type === "text" ? textNode.value : "";
          const parsed = parseHandNotation(raw);
          if (parsed) {
            return (
              <ArticleHand
                hand={parsed.hand}
                winningTile={parsed.winningTile}
                menzen={parsed.menzen}
                naki={parsed.naki}
              />
            );
          }
        }
      }
      return <pre>{children}</pre>;
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
    <>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
      {lightboxImage && (
        <div
          className="article-image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={lightboxImage.alt}
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            className="article-image-lightbox-close"
            aria-label="閉じる"
            onClick={() => setLightboxImage(null)}
          >
            ×
          </button>
          <img
            className="article-image-lightbox-img"
            src={lightboxImage.src}
            alt={lightboxImage.alt}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
