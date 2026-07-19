import { Link } from "react-router-dom";
import { CONTACT_FORM_URL, SITE_NAME } from "../config/site";
import "./contact.css";

/**
 * お問い合わせ専用ページ。フォーム本体は Google フォームを利用し、当ページを
 * サイト内の唯一の問い合わせ窓口（canonical）とする。運営者情報・プライバシー
 * ポリシーからは当ページへ内部リンクで集約する。
 */
export function ContactPage() {
  return (
    <main className="page-shell contact-page">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 mx-[calc(50%-50vw)] mt-[calc(-1*var(--space-4))] sm:mt-[calc(-1*var(--space-6))] px-[max(16px,calc(50vw-320px))] py-[10px] bg-[rgba(255,248,231,0.86)] backdrop-blur-[10px] [-webkit-backdrop-filter:blur(10px)] border-b-2 border-[rgba(43,168,162,0.22)]">
        <h1 className="text-[1.15rem] font-extrabold tracking-[0.02em] text-fl-teal-dark">
          お問い合わせ
        </h1>
        <div className="flex gap-2">
          <Link
            to="/"
            className="inline-flex items-center min-h-[36px] px-[14px] text-[0.8rem] font-bold text-fl-teal-dark no-underline bg-fl-cream border-2 border-fl-teal rounded-[var(--fl-r-pill)] transition-[transform,background,color] duration-[var(--fl-dur)] ease-[var(--fl-bounce)] hover:text-fl-cream hover:bg-fl-teal hover:no-underline hover:-translate-y-0.5 active:scale-95 motion-reduce:transition-none motion-reduce:transform-none"
          >
            ホーム
          </Link>
        </div>
      </div>

      <section
        className="flex flex-col gap-2 py-[18px] px-5 bg-fl-card border-2 border-[rgba(43,168,162,0.22)] rounded-[var(--fl-r-lg)] shadow-[var(--fl-glow-teal-soft)] animate-[contact-rise_380ms_var(--fl-bounce)_both] motion-reduce:animate-none"
        aria-label="お問い合わせ窓口"
      >
        <h2 className="text-[1.05rem] font-extrabold text-fl-teal-dark pb-1.5 border-b-[3px] border-[rgba(43,168,162,0.4)] [border-bottom-style:dashed]">
          お問い合わせ窓口
        </h2>
        <p className="m-0 text-fl-body leading-[var(--leading-normal)]">
          {SITE_NAME}
          に関するご意見・ご要望、点数計算や解説内容の誤りのご指摘、広告・掲載内容についてのお問い合わせは、下記のフォームよりお願いいたします。内容を確認のうえ、必要に応じて対応いたします。
        </p>
        <p className="mt-1">
          <a
            className="inline-flex items-center justify-center min-h-[48px] px-[24px] text-fl-cream bg-fl-teal border-2 border-fl-teal-dark rounded-[var(--fl-r-pill)] shadow-[var(--fl-glow-teal-soft)] no-underline transition-[transform,background] duration-[var(--fl-dur)] ease-[var(--fl-bounce)] hover:text-fl-cream hover:bg-fl-teal-dark hover:-translate-y-0.5 active:scale-[0.97] motion-reduce:transition-none motion-reduce:transform-none"
            href={CONTACT_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            お問い合わせフォームを開く
          </a>
        </p>
      </section>

      <section
        className="flex flex-col gap-2 py-[18px] px-5 bg-fl-card border-2 border-[rgba(43,168,162,0.22)] rounded-[var(--fl-r-lg)] shadow-[var(--fl-glow-teal-soft)] animate-[contact-rise_380ms_var(--fl-bounce)_both] motion-reduce:animate-none"
        aria-label="ご留意事項"
      >
        <h2 className="text-[1.05rem] font-extrabold text-fl-teal-dark pb-1.5 border-b-[3px] border-[rgba(43,168,162,0.4)] [border-bottom-style:dashed]">
          ご留意事項
        </h2>
        <ul className="m-0 pl-[1.3em] flex flex-col gap-2 leading-[var(--leading-normal)] marker:text-fl-teal">
          <li>お問い合わせフォームは Google フォームを利用しています。</li>
          <li>いただいたお問い合わせすべてへの返信をお約束するものではありません。</li>
          <li>
            個人情報の取扱いについては
            <Link
              to="/privacy"
              className="text-fl-teal-dark font-bold underline underline-offset-2 hover:text-fl-teal"
            >
              プライバシーポリシー
            </Link>
            をご覧ください。
          </li>
        </ul>
      </section>
    </main>
  );
}
