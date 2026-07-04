import { Route, Routes } from "react-router-dom";
import { TileGalleryPage } from "./components/dev/TileGalleryPage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Footer } from "./components/Footer";
import { FuQuizPage } from "./components/FuQuizPage";
import { FuResultPage } from "./components/FuResultPage";
import { HomePage } from "./components/HomePage";
import { PrivacyPolicyPage } from "./components/PrivacyPolicyPage";
import { QuizPage } from "./components/QuizPage";
import { ResultPage } from "./components/ResultPage";
import { StatsPage } from "./components/StatsPage";

function App() {
  return (
    // フッターはエラー時も含め全画面に出したいので、ErrorBoundary の外側に置く。
    <div className="app-layout">
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/fu/quiz" element={<FuQuizPage />} />
          <Route path="/fu/result" element={<FuResultPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          {/* 開発用: 牌表示コンポーネントの目視確認ページ。本番導線にはリンクしない。 */}
          <Route path="/dev/tiles" element={<TileGalleryPage />} />
        </Routes>
      </ErrorBoundary>
      <Footer />
    </div>
  );
}

export default App;
