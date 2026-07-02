import { Route, Routes } from "react-router-dom";
import { TileGalleryPage } from "./components/dev/TileGalleryPage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { HomePage } from "./components/HomePage";
import { QuizPage } from "./components/QuizPage";
import { ResultPage } from "./components/ResultPage";
import { StatsPage } from "./components/StatsPage";

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/stats" element={<StatsPage />} />
        {/* 開発用: 牌表示コンポーネントの目視確認ページ。本番導線にはリンクしない。 */}
        <Route path="/dev/tiles" element={<TileGalleryPage />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
