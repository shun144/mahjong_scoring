import { Route, Routes } from "react-router-dom";
import { AboutPage } from "./AboutPage";
import { ArticleListPage } from "@/features/articles/presentation/ArticleListPage";
import { ArticlePage } from "@/features/articles/presentation/ArticlePage";
import { ContactPage } from "./ContactPage";
import { ConvertQuizPage } from "@/features/practice/presentation/ConvertQuizPage/ConvertQuizPage";
import { ErrorBoundary } from "@/shared/ErrorBoundary";
import { Footer } from "@/shared/components/Footer";
import { FuPartsQuizPage } from "@/features/practice/presentation/FuPartsQuizPage/FuPartsQuizPage";
import { FuQuizPage } from "@/features/practice/presentation/FuQuizPage/FuQuizPage";
import { FuResultPage } from "@/features/practice/presentation/FuResultPage/FuResultPage";
import { HomePage } from "./HomePage";
import { PrivacyPolicyPage } from "./PrivacyPolicyPage";
import { QuizPage } from "@/features/practice/presentation/QuizPage/QuizPage";
import { ResultPage } from "@/features/practice/presentation/ResultPage/ResultPage";
import { RouteMeta } from "./RouteMeta";
import { StatsPage } from "@/features/practice/presentation/StatsPage/StatsPage";
import { SettingsPage } from "@/features/settings/presentation/SettingsPage";
import { SettingsProvider } from "@/features/settings/presentation/SettingsContext";
import { ScrollTop } from "@/shared/components/ScrollTop";

function App() {
  return (
    <div className="app-layout">
      <RouteMeta />
      <ScrollTop />
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
            <Route path="/contact" element={<ContactPage />} />
          </Routes>
        </ErrorBoundary>
      </SettingsProvider>
      <Footer />
    </div>
  );
}

export default App;
