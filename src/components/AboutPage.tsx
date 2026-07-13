import { Link } from "react-router-dom";
import { CONTACT_FORM_URL, OPERATOR_NAME, SITE_NAME } from "../config/site";
import "./about.css";

export function AboutPage() {
  return (
    <main className="page-shell about-page">
      <div className="page-header">
        <h1>運営者情報</h1>
        <div className="page-header-link">
          <Link to="/" className="page-header-link-item">
            ホーム
          </Link>
        </div>
      </div>

      <section className="about-section" aria-label="当サイトについて">
        <h2>当サイトについて</h2>
        <p>
          {SITE_NAME}は、麻雀の点数計算（符・翻・点数）をスマホWebで反復練習できるドリルアプリです。ランダムに出題される和了形を見て、正しい点数や符を4択から選び、間違えた際にはその理由（役・翻・符・計算式）を解説する形で、実戦で使える点数計算力を身につけることを目的としています。
        </p>
      </section>

      <section className="about-section" aria-label="運営者">
        <h2>運営者</h2>
        <p>
          当サイトは個人（ハンドルネーム: {OPERATOR_NAME}）が運営しています。麻雀の点数計算の習得に役立つツールを提供したいという思いから、個人開発として制作・運営しています。
        </p>
      </section>

      <section className="about-section" aria-label="提供コンテンツ">
        <h2>提供コンテンツ</h2>
        <ul>
          <li>
            <Link to="/quiz">点数計算モード</Link>: 和了形から最終点数を4択で答える練習
          </li>
          <li>
            <Link to="/fu/quiz">符計算モード</Link>: 和了形から符を4択で答える練習
          </li>
          <li>
            <Link to="/fu/parts">符分解モード</Link>: 符を構成要素ごとに組み立てる練習
          </li>
          <li>
            <Link to="/convert">点数換算モード</Link>: 符・翻から点数を即答する早見表の反復練習
          </li>
          <li>
            <Link to="/articles">学習ガイド</Link>: 点数計算の理解を助ける解説記事
          </li>
        </ul>
      </section>

      <section className="about-section" aria-label="広告について">
        <h2>広告について</h2>
        <p>
          当サイトは、第三者配信の広告サービス（Google AdSense など）を利用しています。広告配信に伴う
          Cookie の利用やパーソナライズ広告のオプトアウト方法については、
          <Link to="/privacy">プライバシーポリシー</Link>をご覧ください。
        </p>
      </section>

      <section className="about-section" aria-label="免責事項">
        <h2>免責事項</h2>
        <p>
          当サイトの点数計算・解説は正確性の確保に努めていますが、内容の正確性・完全性を保証するものではありません。当サイトは標準的なリーチ麻雀ルールを前提としており、地域やお店独自のローカルルール・ハウスルールには対応していません。当サイトの利用によって生じた損害について、運営者は責任を負いかねます。
        </p>
      </section>

      <section className="about-section" aria-label="お問い合わせ">
        <h2>お問い合わせ</h2>
        <p>当サイトに関するお問い合わせは、下記の窓口までお願いいたします。</p>
        <p className="about-contact">
          <a href={CONTACT_FORM_URL} target="_blank" rel="noopener noreferrer">
            お問い合わせフォームを開く
          </a>
        </p>
      </section>
    </main>
  );
}
