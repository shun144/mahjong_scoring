import { Link } from "react-router-dom";
import { MODES } from "../config/modes";
import type { Tile } from "../engine/model";
import { TileFace } from "./tiles/TileFace";
import "./home.css";

// 各モードカードの装飾に使う代表牌（見た目のみ。採点ロジックには無関係）。
// ラベル・遷移先パスは ../config/modes.ts（サイドバーのモード切替と共有）から取得し、
// ここでは HomePage 固有の見た目情報（装飾牌・説明文・CSS修飾クラス）のみを保持する。
const MODE_CARD_INFO: Record<string, { tile: Tile; desc: string; modifierClass: string }> = {
  score: { tile: { suit: "z", rank: 7 }, desc: "最終点数を当てる", modifierClass: "home-mode--score" }, // 中
  fu: { tile: { suit: "p", rank: 5, red: true }, desc: "符を答える", modifierClass: "home-mode--fu" }, // 赤5筒
  "fu-parts": {
    tile: { suit: "m", rank: 8 }, // 8萬
    desc: "符を要素ごとに組み立てる",
    modifierClass: "home-mode--parts",
  },
  convert: {
    tile: { suit: "s", rank: 5, red: true }, // 赤5索
    desc: "符・翻から点数を早見",
    modifierClass: "home-mode--convert",
  },
};
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
          <p className="home-hero-sub">選択肢から答える反復トレーニング</p>
        </section>

        <nav className="home-modes" aria-label="練習モード">
          <h2 className="home-modes-title">
            <span className="home-modes-title-icon" aria-hidden="true">
              🀄
            </span>
            練習メニュー
          </h2>

          <div className="home-modes-grid">
            {MODES.map((mode) => {
              const info = MODE_CARD_INFO[mode.id];
              return (
                <Link key={mode.id} to={mode.path} className={`home-mode ${info.modifierClass}`}>
                  <span className="home-mode-icon" aria-hidden="true">
                    <TileFace tile={info.tile} size="sm" />
                  </span>
                  <span className="home-mode-body">
                    <span className="home-mode-title">{mode.label}</span>
                    <span className="home-mode-desc">{info.desc}</span>
                  </span>
                  <span className="home-mode-arrow" aria-hidden="true">
                    ›
                  </span>
                </Link>
              );
            })}

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
