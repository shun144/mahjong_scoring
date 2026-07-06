import { Link } from "react-router-dom";
import "./home.css";

export function HomePage() {
  return (
    <main className="home-page">
      <h1>麻雀点数トレーニング</h1>
      <p>ランダムに出題される和了形を見て、最終点数または符を当てて練習しよう。</p>
      <nav className="home-nav">
        <Link to="/quiz" className="btn-primary">
          点数計算を始める
        </Link>
        <Link to="/fu/quiz" className="btn-primary">
          符計算を始める
        </Link>
        <Link to="/stats" className="btn-secondary">
          成績を見る
        </Link>
      </nav>
    </main>
  );
}
