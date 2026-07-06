import { Link } from "react-router-dom";
import "./footer.css";

/**
 * 全画面共通のフッター。広告掲載に伴い、どの画面からでもプライバシーポリシーへ
 * 到達できるようにする（AdSense 等の「容易に到達可能」要件を満たす）。
 */
export function Footer() {
  return (
    <footer className="app-footer">
      <nav className="app-footer-nav" aria-label="フッター">
        <Link to="/privacy">プライバシーポリシー</Link>
      </nav>
      <p className="app-footer-copy">© 2026 麻雀点数トレーニング</p>
    </footer>
  );
}
