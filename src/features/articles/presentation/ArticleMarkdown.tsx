import { useEffect, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";
import { parseHandNotation } from "../domain/handNotation";
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

const LINK_CLASS = "text-fl-teal-dark font-bold underline underline-offset-2 hover:text-fl-teal";
const PRE_CLASS =
  "m-0 py-[14px] px-4 overflow-x-auto border-2 border-[rgba(43,168,162,0.28)] rounded-[var(--fl-r-md)] bg-fl-cream text-[length:var(--fs-sm)] [font-family:var(--font-numeric)]";
const TABLE_CELL_CLASS =
  "py-2 px-3 border border-[rgba(43,168,162,0.2)] text-left align-top last:w-[4.5em]";

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
          data-testid="article-image-trigger"
          className="block w-full p-0 border-2 border-[rgba(43,168,162,0.28)] rounded-[var(--fl-r-md)] bg-fl-teal-bg cursor-zoom-in leading-none"
          onClick={() => setLightboxImage({ src, alt: altText })}
        >
          <img className="block max-w-full h-auto rounded-[inherit]" src={src} alt={altText} />
        </button>
      );
    },
    p({ node, children }) {
      const soleChild = node?.children.length === 1 ? node.children[0] : undefined;
      const isImageCaption = soleChild?.type === "element" && soleChild.tagName === "em";
      return (
        <p
          className={
            isImageCaption ? "m-0 text-[length:var(--fs-sm)] text-fl-muted text-center" : "m-0"
          }
        >
          {children}
        </p>
      );
    },
    h1({ children }) {
      return (
        <h1 className="text-2xl font-extrabold leading-[var(--leading-tight)] text-fl-ink">
          {children}
          <span
            aria-hidden="true"
            className="block w-14 h-[5px] mt-3 bg-fl-gold rounded-[var(--fl-r-pill)]"
          />
        </h1>
      );
    },
    h2({ children }) {
      return (
        <h2 className="mt-[var(--space-3)] pb-[6px] text-[1.15rem] font-extrabold text-fl-teal-dark border-b-[3px] border-[rgba(43,168,162,0.4)] [border-bottom-style:dashed]">
          {children}
        </h2>
      );
    },
    h3({ children }) {
      return <h3 className="-mb-4">{children}</h3>;
    },
    ul({ children }) {
      return (
        <ul className="m-0 pl-[1.3em] flex flex-col gap-[var(--space-2)] marker:text-fl-teal">
          {children}
        </ul>
      );
    },
    ol({ children }) {
      return (
        <ol className="m-0 pl-[1.3em] flex flex-col gap-[var(--space-2)] marker:text-fl-teal">
          {children}
        </ol>
      );
    },
    blockquote({ children }) {
      return (
        <blockquote className="m-0 py-[14px] px-4 border-2 border-[rgba(43,168,162,0.3)] border-l-[6px] border-l-fl-teal rounded-[var(--fl-r-md)] bg-fl-teal-bg text-fl-body">
          {children}
        </blockquote>
      );
    },
    hr() {
      return (
        <hr className="m-0 border-none border-t-[3px] [border-bottom-style:dashed] border-[rgba(43,168,162,0.35)]" />
      );
    },
    table({ children }) {
      return (
        <div className="overflow-x-auto border-2 border-[rgba(43,168,162,0.28)] rounded-[var(--fl-r-md)]">
          <table className="w-full border-collapse text-[length:var(--fs-sm)]">{children}</table>
        </div>
      );
    },
    th({ children }) {
      return (
        <th
          className={`${TABLE_CELL_CLASS} whitespace-nowrap text-fl-teal-dark font-extrabold bg-fl-teal-bg`}
        >
          {children}
        </th>
      );
    },
    td({ children }) {
      return <td className={TABLE_CELL_CLASS}>{children}</td>;
    },
    code({ children }) {
      return (
        <code className="py-px px-[7px] text-[0.9em] text-fl-teal-dark bg-fl-teal-bg rounded-[7px] [font-family:var(--font-numeric)]">
          {children}
        </code>
      );
    },
    pre({ node, children }) {
      const soleChild = node?.children.length === 1 ? node.children[0] : undefined;
      if (soleChild?.type === "element" && soleChild.tagName === "code") {
        const classProp = soleChild.properties?.className;
        const classNames = Array.isArray(classProp) ? classProp.map(String) : [];
        const textNode = soleChild.children[0];
        const raw = textNode?.type === "text" ? textNode.value : "";
        if (classNames.includes("language-mahjong")) {
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
        return (
          <pre className={PRE_CLASS}>
            <code>{raw}</code>
          </pre>
        );
      }
      return <pre className={PRE_CLASS}>{children}</pre>;
    },
    a({ href, children }) {
      const kind = href ? resolveLinkKind(href, articleSlugs) : "text";
      if (kind === "route" && href) {
        return (
          <Link to={href} className={LINK_CLASS}>
            {children}
          </Link>
        );
      }
      if (kind === "external" && href) {
        return (
          <a href={href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
            {children}
          </a>
        );
      }
      return <span>{children}</span>;
    },
  };

  return (
    <>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-[rgba(30,30,30,0.75)] cursor-zoom-out"
          role="dialog"
          aria-modal="true"
          aria-label={lightboxImage.alt}
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 w-10 h-10 border-none rounded-full bg-[rgba(255,255,255,0.92)] text-[#123f3c] text-2xl leading-none cursor-pointer"
            aria-label="閉じる"
            onClick={() => setLightboxImage(null)}
          >
            ×
          </button>
          <img
            className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.4)] cursor-default"
            src={lightboxImage.src}
            alt={lightboxImage.alt}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
