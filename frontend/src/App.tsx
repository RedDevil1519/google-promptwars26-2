/**
 * App.tsx
 *
 * Root application component.
 * Sets up React Router v6 with lazy-loaded routes wrapped in Suspense.
 * Each route is code-split for optimal initial bundle size.
 */
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import { Spinner } from '@shared/components/Spinner';

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
 * Root App component with routing and error boundary.
 */
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
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
