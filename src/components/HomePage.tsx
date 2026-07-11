import { Link } from "react-router-dom";
import type { Tile } from "../engine/model";
import { TileFace } from "./tiles/TileFace";
import "./home.css";

// 各モードカードの装飾に使う代表牌（見た目のみ。採点ロジックには無関係）。
const SCORE_TILE: Tile = { suit: "z", rank: 7 }; // 中
const FU_TILE: Tile = { suit: "p", rank: 5, red: true }; // 赤5筒
const CONVERT_TILE: Tile = { suit: "s", rank: 5, red: true }; // 赤5索
const STATS_TILE: Tile = { suit: "z", rank: 6 }; // 發
// ヘッダーのブランドマークに使う代表牌（見た目のみ）。
const BRAND_TILE: Tile = { suit: "z", rank: 1 }; // 東

// ヒーロー背後に扇状に並ぶ装飾カード（Flip7 パッケージのファン配置）。純装飾。
const FAN_CARDS = ["teal", "coral", "gold", "sky", "mint"] as const;

export function HomePage() {
  return (
    // ルートは <main>（.app-layout > main の flex でフッターを下端へ押し出す前提）。
    <main className="home-page">
      <header className="home-topbar">
        <Link to="/" className="home-brand" aria-label="麻雀点数トレーニング ホーム">
          <span className="home-brand-chip" aria-hidden="true">
            <TileFace tile={BRAND_TILE} size="sm" />
          </span>
          <span className="home-brand-name">麻雀点数トレーニング</span>
        </Link>
        <nav className="home-topbar-nav" aria-label="ヘッダー">
          <Link to="/settings" className="home-pill-btn">
            <span className="home-pill-btn-icon" aria-hidden="true">
              ⚙
            </span>
            設定
          </Link>
        </nav>
      </header>

      <div className="home-content">
        <section className="home-hero">
          <span className="home-hero-fan" aria-hidden="true">
            {FAN_CARDS.map((c) => (
              <span key={c} className={`home-hero-fan-card home-hero-fan-card--${c}`} />
            ))}
          </span>
          <span className="home-ribbon">4択ドリル</span>
          <h1 className="home-hero-title">
            和了形から<span className="home-hero-mark">点数</span>を当てる
          </h1>
          <p className="home-hero-sub">最終点数または符を4択で答える反復ドリル。</p>
        </section>

        <nav className="home-modes" aria-label="練習モード">
          <h2 className="home-modes-title">
            <span className="home-modes-title-icon" aria-hidden="true">
              🀄
            </span>
            練習メニュー
          </h2>

          <div className="home-modes-grid">
            <Link to="/quiz" className="home-mode home-mode--score">
              <span className="home-mode-icon" aria-hidden="true">
                <TileFace tile={SCORE_TILE} size="sm" />
              </span>
              <span className="home-mode-body">
                <span className="home-mode-title">点数計算モード</span>
                <span className="home-mode-desc">最終点数を当てる</span>
              </span>
              <span className="home-mode-arrow" aria-hidden="true">
                ›
              </span>
            </Link>

            <Link to="/fu/quiz" className="home-mode home-mode--fu">
              <span className="home-mode-icon" aria-hidden="true">
                <TileFace tile={FU_TILE} size="sm" />
              </span>
              <span className="home-mode-body">
                <span className="home-mode-title">符計算モード</span>
                <span className="home-mode-desc">符を答える</span>
              </span>
              <span className="home-mode-arrow" aria-hidden="true">
                ›
              </span>
            </Link>

            <Link to="/convert" className="home-mode home-mode--convert">
              <span className="home-mode-icon" aria-hidden="true">
                <TileFace tile={CONVERT_TILE} size="sm" />
              </span>
              <span className="home-mode-body">
                <span className="home-mode-title">点数換算モード</span>
                <span className="home-mode-desc">符・翻から点数を早見</span>
              </span>
              <span className="home-mode-arrow" aria-hidden="true">
                ›
              </span>
            </Link>

            <Link to="/stats" className="home-mode home-mode--stats home-mode--wide">
              <span className="home-mode-icon" aria-hidden="true">
                <TileFace tile={STATS_TILE} size="sm" />
              </span>
              <span className="home-mode-body">
                <span className="home-mode-title">成績</span>
                <span className="home-mode-desc">正答率・苦手分野を確認</span>
              </span>
              <span className="home-mode-arrow" aria-hidden="true">
                ›
              </span>
            </Link>
          </div>
        </nav>

        <p className="home-articles-link">
          <Link to="/articles" className="home-guide-pill">
            <span className="home-guide-pill-icon" aria-hidden="true">
              📖
            </span>
            点数計算の学習ガイドを読む
          </Link>
        </p>
      </div>
    </main>
  );
}
