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
      <div className="page-header">
        <h1>お問い合わせ</h1>
        <div className="page-header-link">
          <Link to="/" className="page-header-link-item">
            ホーム
          </Link>
        </div>
      </div>

      <section className="contact-section" aria-label="お問い合わせ窓口">
        <h2>お問い合わせ窓口</h2>
        <p>
          {SITE_NAME}
          に関するご意見・ご要望、点数計算や解説内容の誤りのご指摘、広告・掲載内容についてのお問い合わせは、下記のフォームよりお願いいたします。内容を確認のうえ、必要に応じて対応いたします。
        </p>
        <p className="contact-cta">
          <a
            className="contact-button"
            href={CONTACT_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            お問い合わせフォームを開く
          </a>
        </p>
      </section>

      <section className="contact-section" aria-label="ご留意事項">
        <h2>ご留意事項</h2>
        <ul>
          <li>お問い合わせフォームは Google フォームを利用しています。</li>
          <li>いただいたお問い合わせすべてへの返信をお約束するものではありません。</li>
          <li>
            個人情報の取扱いについては<Link to="/privacy">プライバシーポリシー</Link>
            をご覧ください。
          </li>
        </ul>
      </section>
    </main>
  );
}
