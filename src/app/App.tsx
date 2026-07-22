import { SettingsProvider } from "@/features/settings/presentation/SettingsContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Footer } from "@/components/Footer";
import { ScrollTop } from "@/components/ScrollTop";
import { RouteMeta } from "./RouteMeta";
import { Router } from "./Router";

function App() {
  return (
    <div className="app-layout">
      <RouteMeta />
      <ScrollTop />
      <SettingsProvider>
        <ErrorBoundary>
          <Router />
        </ErrorBoundary>
      </SettingsProvider>
      <Footer />
    </div>
  );
}

export default App;
