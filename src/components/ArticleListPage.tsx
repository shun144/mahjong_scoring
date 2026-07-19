import { Link } from "react-router-dom";
import { getAllArticles } from "../content/articles/registry";
import "./articles.css";

interface ArticleCardAccent {
  bar: string;
  border: string;
  shadow: string;
  hoverBorder: string;
  hoverShadow: string;
}

// 一覧カードのアクセント色（ティール→コーラル→ゴールド→スカイの4色で巡回）。
// border/shadowは元CSSのcolor-mix(in srgb, var(--accent) N%, ...)と同じ見た目になるよう、
// 不透明な白背景上でのアルファ合成がcolor-mixと数式的に一致するrgba()へ変換した値。
const ARTICLE_CARD_ACCENTS: readonly ArticleCardAccent[] = [
  {
    bar: "bg-fl-teal",
    border: "border-[rgba(43,168,162,0.22)]",
    shadow: "shadow-[0_6px_18px_rgba(43,168,162,0.26)]",
    hoverBorder: "hover:border-fl-teal",
    hoverShadow: "hover:shadow-[0_14px_30px_rgba(43,168,162,0.42)]",
  },
  {
    bar: "bg-fl-coral",
    border: "border-[rgba(239,108,74,0.22)]",
    shadow: "shadow-[0_6px_18px_rgba(239,108,74,0.26)]",
    hoverBorder: "hover:border-fl-coral",
    hoverShadow: "hover:shadow-[0_14px_30px_rgba(239,108,74,0.42)]",
  },
  {
    bar: "bg-fl-gold-dark",
    border: "border-[rgba(230,184,0,0.22)]",
    shadow: "shadow-[0_6px_18px_rgba(230,184,0,0.26)]",
    hoverBorder: "hover:border-fl-gold-dark",
    hoverShadow: "hover:shadow-[0_14px_30px_rgba(230,184,0,0.42)]",
  },
  {
    bar: "bg-fl-sky",
    border: "border-[rgba(93,173,226,0.22)]",
    shadow: "shadow-[0_6px_18px_rgba(93,173,226,0.26)]",
    hoverBorder: "hover:border-fl-sky",
    hoverShadow: "hover:shadow-[0_14px_30px_rgba(93,173,226,0.42)]",
  },
];

export function ArticleListPage() {
  const articles = getAllArticles();

  return (
    <main className="page-shell articles-page">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 mx-[calc(50%-50vw)] mt-[calc(-1*var(--space-4))] sm:mt-[calc(-1*var(--space-6))] px-[max(16px,calc(50vw-320px))] py-[10px] bg-[rgba(255,248,231,0.86)] backdrop-blur-[10px] [-webkit-backdrop-filter:blur(10px)] border-b-2 border-[rgba(43,168,162,0.22)]">
        <h1 className="text-[1.15rem] font-extrabold tracking-[0.04em] text-fl-teal-dark">学習ガイド</h1>
        <div className="flex gap-2">
          <Link
            to="/"
            className="inline-flex items-center min-h-[36px] px-[14px] text-[0.8rem] font-bold text-fl-teal-dark no-underline bg-fl-cream border-2 border-fl-teal rounded-[var(--fl-r-pill)] transition-[transform,background,color] duration-[var(--fl-dur)] ease-[var(--fl-bounce)] hover:text-fl-cream hover:bg-fl-teal hover:no-underline hover:-translate-y-0.5 active:scale-95 motion-reduce:transition-none motion-reduce:transform-none"
          >
            ホーム
          </Link>
        </div>
      </div>

      <ul className="list-none m-0 p-0 grid grid-cols-2 gap-[14px]">
        {articles.map((article, i) => {
          const accent = ARTICLE_CARD_ACCENTS[i % ARTICLE_CARD_ACCENTS.length];
          return (
            <li key={article.slug} className="flex">
              <Link
                to={`/articles/${article.slug}`}
                className={`relative flex-1 flex items-center justify-center min-h-[116px] pt-5 pr-4 pb-5 pl-[22px] bg-fl-card border-2 ${accent.border} rounded-[var(--fl-r-lg)] ${accent.shadow} no-underline text-fl-ink overflow-hidden transition-[transform,box-shadow,border-color] duration-[var(--fl-dur)] ease-[var(--fl-bounce)] animate-[articles-rise_400ms_var(--fl-bounce)_both] ${accent.hoverBorder} ${accent.hoverShadow} hover:-translate-y-1 active:scale-[0.98] motion-reduce:animate-none motion-reduce:transition-none motion-reduce:transform-none`}
              >
                <span aria-hidden="true" className={`absolute left-0 top-0 bottom-0 w-1.5 ${accent.bar}`} />
                <span className="text-[1.02rem] font-extrabold leading-[1.35] text-center text-fl-ink">
                  {article.title}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
