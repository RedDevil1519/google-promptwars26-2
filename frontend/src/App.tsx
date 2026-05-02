/**
 * App.tsx
 *
 * Root application component.
 * Sets up React Router v6 with lazy-loaded routes wrapped in Suspense.
 * Each route is code-split for optimal initial bundle size.
 *
 * PWA: Includes a subtle "Install App" button in the global header
 *      powered by the usePWAInstall hook.
 */
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import { Spinner } from '@shared/components/Spinner';
import { usePWAInstall } from '@shared/hooks/usePWAInstall';

/**
 * Lazy-loaded route components — each is a separate JS chunk.
 * They are only downloaded when the user navigates to that route.
 */
const HomePage = lazy(() => import('@pages/HomePage'));
const ElectionPage = lazy(() => import('@pages/ElectionPage'));

/**
 * Full-screen loading fallback shown while a lazy route chunk is downloading.
 */
const PageLoadingFallback: React.FC = () => (
  <div className="page-loading" role="status" aria-label="Loading page...">
    <Spinner size={64} label="Loading page content..." />
    <p className="page-loading__text">Initializing Voter Protocol Engine…</p>
  </div>
);

/**
 * A subtle PWA install banner shown when the browser signals the app
 * is installable. Hidden automatically after installation.
 *
 * @param onInstall - Callback that triggers the native install prompt
 */
const PWAInstallBanner: React.FC<{ onInstall: () => Promise<void> }> = ({ onInstall }) => (
  <div
    className="pwa-install-banner"
    role="complementary"
    aria-label="Install Voter Protocol as an app"
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      background: 'linear-gradient(90deg, #0a0e1a 0%, #131929 50%, #0a0e1a 100%)',
      borderBottom: '1px solid #00d4ff',
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
      color: '#e2e8f0',
    }}
  >
    <span aria-hidden="true">📲</span>
    <span>Get the full experience offline</span>
    <button
      id="pwa-install-btn"
      className="btn btn-primary btn-sm"
      onClick={() => void onInstall()}
      aria-label="Install Voter Protocol Engine as a Progressive Web App"
      style={{ marginLeft: '0.5rem', padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
    >
      ⬇ Install App
    </button>
  </div>
);

/**
 * Root App component with routing, error boundary, and PWA install prompt.
 */
const App: React.FC = () => {
  const { isInstallable, promptInstall, isInstalled } = usePWAInstall();

  return (
    <BrowserRouter>
      <ErrorBoundary>
        {/* PWA install banner — only shown when browser deems app installable */}
        {isInstallable && !isInstalled && (
          <PWAInstallBanner onInstall={promptInstall} />
        )}

        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/election" element={<ElectionPage />} />
            {/* 404 fallback */}
            <Route
              path="*"
              element={
                <div
                  className="not-found"
                  role="main"
                  aria-label="Page not found"
                >
                  <h1>404 — Page Not Found</h1>
                  <p>
                    <a href="/" aria-label="Return to home page">
                      Return Home
                    </a>
                  </p>
                </div>
              }
            />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default App;
