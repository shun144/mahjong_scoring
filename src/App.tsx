import { Route, Routes } from "react-router-dom";
import { AboutPage } from "./components/AboutPage";
import { ArticleListPage } from "./components/ArticleListPage";
import { ArticlePage } from "./components/ArticlePage";
import { ConvertQuizPage } from "./components/ConvertQuizPage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Footer } from "./components/Footer";
import { FuPartsQuizPage } from "./components/FuPartsQuizPage";
import { FuQuizPage } from "./components/FuQuizPage";
import { FuResultPage } from "./components/FuResultPage";
import { HomePage } from "./components/HomePage";
import { PrivacyPolicyPage } from "./components/PrivacyPolicyPage";
import { QuizPage } from "./components/QuizPage";
import { ResultPage } from "./components/ResultPage";
import { SettingsPage } from "./components/SettingsPage";
import { StatsPage } from "./components/StatsPage";
import { SettingsProvider } from "./settings/SettingsContext";

function App() {
  return (
    // フッターはエラー時も含め全画面に出したいので、ErrorBoundary の外側に置く。
    <div className="app-layout">
      <SettingsProvider>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/result" element={<ResultPage />} />
            <Route path="/fu/quiz" element={<FuQuizPage />} />
            <Route path="/fu/result" element={<FuResultPage />} />
            <Route path="/fu/parts" element={<FuPartsQuizPage />} />
            <Route path="/convert" element={<ConvertQuizPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/articles" element={<ArticleListPage />} />
            <Route path="/articles/:slug" element={<ArticlePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </ErrorBoundary>
      </SettingsProvider>
      <Footer />
    </div>
  );
}

export default App;
