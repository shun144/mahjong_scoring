import { Link } from "react-router-dom";
import { SITE_NAME } from "../config/site";
import "./privacy.css";

const EFFECTIVE_DATE = "2026年7月4日";

export function PrivacyPolicyPage() {
  return (
    <main className="page-shell privacy-page">
      <div className="page-header">
        <h1>プライバシーポリシー</h1>
        <div className="page-header-link">
          <Link to="/" className="page-header-link-item">
            ホーム
          </Link>
        </div>
      </div>

      <p>
        {SITE_NAME}
        （以下「当サイト」といいます）は、ユーザーの個人情報を含む情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます）を定めます。
      </p>

      <section className="privacy-section" aria-label="第1条 個人情報">
        <h2>第1条（個人情報）</h2>
        <p>
          「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報を指します。
        </p>
        <p>
          現時点で当サイトは、ユーザー登録機能を提供しておらず、個人情報を積極的に収集する機能はありません。
        </p>
      </section>

      <section className="privacy-section" aria-label="第2条 広告の配信について">
        <h2>第2条（広告の配信について）</h2>
        <p>当サイトは、第三者配信の広告サービス（Google AdSense など）を利用しています。</p>
        <p>
          このような広告配信事業者は、ユーザーの興味に応じた商品やサービスの広告を表示するため、当サイトや他サイトへのアクセスに関する情報（氏名、住所、メールアドレス、電話番号は含まれません）を、Cookie（クッキー）を使用して収集し利用することがあります。
        </p>
        <ul>
          <li>
            Google などの第三者配信事業者は、Cookie
            を使用して、ユーザーが当サイトや他のサイトに過去にアクセスした際の情報に基づいて広告を配信します。
          </li>
          <li>
            ユーザーは、Google の
            <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer">
              広告設定ページ
            </a>
            で、パーソナライズ広告を無効にできます。
          </li>
          <li>
            また、
            <a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer">
              aboutads.info
            </a>
            のページにアクセスすることで、パーソナライズ広告に使用される第三者配信事業者の Cookie
            を無効にできます。
          </li>
          <li>
            Google の広告における Cookie の取り扱いの詳細については、Google の
            <a
              href="https://policies.google.com/technologies/ads"
              target="_blank"
              rel="noopener noreferrer"
            >
              「広告 – ポリシーと規約」ページ
            </a>
            をご覧ください。
          </li>
        </ul>
      </section>

      <section className="privacy-section" aria-label="第3条 アクセス解析ツールについて">
        <h2>第3条（アクセス解析ツールについて）</h2>
        <p>
          当サイトでは、サイトの利用状況を把握するためにアクセス解析ツール（Google Analytics
          など）を導入する場合があります。これらのツールはデータ収集のために Cookie
          を使用することがあります。このデータは匿名で収集されており、個人を特定するものではありません。
        </p>
        <p>アクセス解析ツールを導入する際は、本ポリシーを改定のうえ、その旨を明記します。</p>
      </section>

      <section className="privacy-section" aria-label="第4条 個人情報を収集・利用する目的">
        <h2>第4条（個人情報を収集・利用する目的）</h2>
        <p>当サイトが個人情報を取得・収集する場合、その利用目的は以下のとおりです。</p>
        <ul>
          <li>お問い合わせへの対応のため</li>
          <li>サービスの改善・新機能開発のため</li>
        </ul>
      </section>

      <section className="privacy-section" aria-label="第5条 個人情報の第三者提供">
        <h2>第5条（個人情報の第三者提供）</h2>
        <p>
          当サイトは、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。ただし、個人情報保護法その他の法令で認められる場合を除きます。
        </p>
        <ul>
          <li>法令に基づく場合</li>
          <li>
            人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき
          </li>
        </ul>
      </section>

      <section className="privacy-section" aria-label="第6条 プライバシーポリシーの変更">
        <h2>第6条（プライバシーポリシーの変更）</h2>
        <p>
          本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく変更することができるものとします。変更後のプライバシーポリシーについては、当サイトに掲載したときから効力を生じるものとします。
        </p>
      </section>

      <section className="privacy-section" aria-label="第7条 お問い合わせ窓口">
        <h2>第7条（お問い合わせ窓口）</h2>
        <p className="privacy-contact">
          本ポリシーに関するお問い合わせは、<Link to="/contact">お問い合わせページ</Link>
          よりお願いいたします。
        </p>
      </section>

      <p className="privacy-date">制定日: {EFFECTIVE_DATE}</p>
    </main>
  );
}
