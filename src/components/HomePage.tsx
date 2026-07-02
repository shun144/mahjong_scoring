import { Link } from "react-router-dom";
import "./home.css";

export function HomePage() {
  return (
    <main className="home-page">
      <h1>麻雀 点数計算ドリル</h1>
      <p>ランダムに出題される和了形の最終点数を当てて、点数計算を練習しよう。</p>
      <nav className="home-nav">
        <Link to="/quiz" className="btn-primary">
          練習を始める
        </Link>
        <Link to="/stats" className="btn-secondary">
          成績を見る
        </Link>
      </nav>
    </main>
  );
}
