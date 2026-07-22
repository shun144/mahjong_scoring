import { Link } from "react-router-dom";
import { OPERATOR_NAME, SITE_NAME } from "../../site";
import "./about.css";

export function AboutPage() {
  const sectionClass =
    "flex flex-col gap-2 py-[18px] px-5 bg-fl-card border-2 border-[rgba(43,168,162,0.22)] rounded-[var(--fl-r-lg)] shadow-[var(--fl-glow-teal-soft)] animate-[about-rise_380ms_var(--fl-bounce)_both] motion-reduce:animate-none";
  const headingClass =
    "text-[1.05rem] font-extrabold text-fl-teal-dark pb-1.5 border-b-[3px] border-[rgba(43,168,162,0.4)] [border-bottom-style:dashed]";
  const bodyClass = "m-0 text-fl-body leading-[var(--leading-normal)]";
  const linkClass = "text-fl-teal-dark font-bold underline underline-offset-2 hover:text-fl-teal";

  return (
    <main className="page-shell about-page">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 mx-[calc(50%-50vw)] mt-[calc(-1*var(--space-4))] sm:mt-[calc(-1*var(--space-6))] px-[max(16px,calc(50vw-320px))] py-[10px] bg-[rgba(255,248,231,0.86)] backdrop-blur-[10px] [-webkit-backdrop-filter:blur(10px)] border-b-2 border-[rgba(43,168,162,0.22)]">
        <h1 className="text-[1.15rem] font-extrabold tracking-[0.02em] text-fl-teal-dark">
          運営者情報
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

      <section className={sectionClass} aria-label="当サイトについて">
        <h2 className={headingClass}>当サイトについて</h2>
        <p className={bodyClass}>
          {SITE_NAME}
          は、麻雀の点数計算（符・翻・点数）をスマホWebで反復練習できるドリルアプリです。ランダムに出題される和了形を見て、正しい点数や符を4択から選び、間違えた際にはその理由（役・翻・符・計算式）を解説する形で、実戦で使える点数計算力を身につけることを目的としています。
        </p>
      </section>

      <section className={sectionClass} aria-label="運営者">
        <h2 className={headingClass}>運営者</h2>
        <p className={bodyClass}>
          当サイトは個人（ハンドルネーム: {OPERATOR_NAME}
          ）が運営しています。麻雀の点数計算の習得に役立つツールを提供したいという思いから、個人開発として制作・運営しています。
        </p>
      </section>

      <section className={sectionClass} aria-label="提供コンテンツ">
        <h2 className={headingClass}>提供コンテンツ</h2>
        <ul className="m-0 pl-[1.3em] flex flex-col gap-2 leading-[var(--leading-normal)] marker:text-fl-teal">
          <li>
            <Link to="/quiz" className={linkClass}>
              点数計算モード
            </Link>
            : 和了形から最終点数を4択で答える練習
          </li>
          <li>
            <Link to="/fu/quiz" className={linkClass}>
              符計算モード
            </Link>
            : 和了形から符を4択で答える練習
          </li>
          <li>
            <Link to="/fu/parts" className={linkClass}>
              符分解モード
            </Link>
            : 符を構成要素ごとに組み立てる練習
          </li>
          <li>
            <Link to="/convert" className={linkClass}>
              点数換算モード
            </Link>
            : 符・翻から点数を即答する早見表の反復練習
          </li>
          <li>
            <Link to="/articles" className={linkClass}>
              学習ガイド
            </Link>
            : 点数計算の理解を助ける解説記事
          </li>
        </ul>
      </section>

      <section className={sectionClass} aria-label="広告について">
        <h2 className={headingClass}>広告について</h2>
        <p className={bodyClass}>
          当サイトは、第三者配信の広告サービス（Google AdSense
          など）を利用しています。広告配信に伴う Cookie
          の利用やパーソナライズ広告のオプトアウト方法については、
          <Link to="/privacy" className={linkClass}>
            プライバシーポリシー
          </Link>
          をご覧ください。
        </p>
      </section>

      <section className={sectionClass} aria-label="免責事項">
        <h2 className={headingClass}>免責事項</h2>
        <p className={bodyClass}>
          当サイトの点数計算・解説は正確性の確保に努めていますが、内容の正確性・完全性を保証するものではありません。当サイトは標準的なリーチ麻雀ルールを前提としており、地域やお店独自のローカルルール・ハウスルールには対応していません。当サイトの利用によって生じた損害について、運営者は責任を負いかねます。
        </p>
      </section>

      <section className={sectionClass} aria-label="お問い合わせ">
        <h2 className={headingClass}>お問い合わせ</h2>
        <p className={`${bodyClass} font-semibold`}>
          当サイトに関するお問い合わせは、
          <Link to="/contact" className={linkClass}>
            お問い合わせページ
          </Link>
          よりお願いいたします。
        </p>
      </section>
    </main>
  );
}
