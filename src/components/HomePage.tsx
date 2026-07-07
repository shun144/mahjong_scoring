import { Link } from "react-router-dom";
import type { Tile } from "../engine/model";
import { TileFace } from "./tiles/TileFace";
import "./home.css";

// 各モードカードの装飾に使う代表牌（見た目のみ。採点ロジックには無関係）。
const SCORE_TILE: Tile = { suit: "z", rank: 7 }; // 中
const FU_TILE: Tile = { suit: "p", rank: 5, red: true }; // 赤5筒
const STATS_TILE: Tile = { suit: "z", rank: 6 }; // 發

export function HomePage() {
  return (
    <main className="home-page">
      <header className="home-hero">
        <h1>麻雀点数トレーニング</h1>
        <p>和了形を見て、最終点数または符を4択で当てる練習。</p>
      </header>

      <nav className="home-modes" aria-label="練習モード">
        <Link to="/quiz" className="home-mode-card home-mode-card--drill">
          <span className="home-mode-icon" aria-hidden="true">
            <TileFace tile={SCORE_TILE} size="sm" />
          </span>
          <span className="home-mode-body">
            <span className="home-mode-title">点数計算モード</span>
            <span className="home-mode-desc">最終点数を当てる</span>
          </span>
        </Link>

        <Link to="/fu/quiz" className="home-mode-card home-mode-card--drill">
          <span className="home-mode-icon" aria-hidden="true">
            <TileFace tile={FU_TILE} size="sm" />
          </span>
          <span className="home-mode-body">
            <span className="home-mode-title">符計算モード</span>
            <span className="home-mode-desc">符を答える</span>
          </span>
        </Link>

        <Link to="/stats" className="home-mode-card home-mode-card--wide">
          <span className="home-mode-icon" aria-hidden="true">
            <TileFace tile={STATS_TILE} size="sm" />
          </span>
          <span className="home-mode-body">
            <span className="home-mode-title">成績を見る</span>
            <span className="home-mode-desc">正答率・苦手分野を確認</span>
          </span>
        </Link>
      </nav>

      <p className="home-articles-link">
        <Link to="/articles">点数計算の学習ガイドを読む</Link>
      </p>
    </main>
  );
}
