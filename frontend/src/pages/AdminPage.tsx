/**
 * AdminPage.tsx
 *
 * Secure /admin route — standalone from the main civic app.
 * Provides a mock admin login (admin / admin123) that shows a
 * "Secure Management Dashboard" on success.
 *
 * Uses backend JWT mock logic via /api/admin/login.
 */
import React from 'react';
import { Link } from 'react-router-dom';

const SESSION_KEY = 'vpe_admin_authed';

/**
 * Mock civic stats for the dashboard display.
 * In production, these would come from a backend analytics endpoint.
 */
const MOCK_STATS = [
  { label: 'Total Queries Today', value: '1,284', icon: '📊', color: '#00d4ff' },
  { label: 'US Mode Hits', value: '891', icon: '🇺🇸', color: '#4ade80' },
  { label: 'India Mode Hits', value: '312', icon: '🇮🇳', color: '#fb923c' },
  { label: 'Cache Hit Rate', value: '78%', icon: '⚡', color: '#a78bfa' },
  { label: 'Gemini API Calls', value: '403', icon: '🤖', color: '#f472b6' },
  { label: 'Avg Response (ms)', value: '420', icon: '🏎️', color: '#34d399' },
];

/**
 * AdminPage — fully isolated admin dashboard.
 */
const AdminPage: React.FC = () => {
  const [isAuthed, setIsAuthed] = React.useState<boolean>(
    () => !!sessionStorage.getItem(SESSION_KEY)
  );
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  /**
   * Handles login form submission via backend API.
   * Uses JWT mock logic to gate the dashboard.
   */
  const handleLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store the mock JWT token
        sessionStorage.setItem(SESSION_KEY, data.token);
        setIsAuthed(true);
      } else {
        setError(data.error || 'Authentication failed. Check credentials.');
      }
    } catch (err) {
      console.error('[Admin Login Error]', err);
      setError('Connection failed. Is the backend running?');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = (): void => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthed(false);
    setUsername('');
    setPassword('');
  };

  // ── Login Screen ─────────────────────────────────────────────────────────────
  if (!isAuthed) {
    return (
      <main className="admin-page" id="main-content" tabIndex={-1} aria-label="Admin login">
        <a href="#main-content" className="skip-link">Skip to main content</a>

        <div className="admin-login">
          <div className="admin-login__card">
            <div className="admin-login__logo" aria-hidden="true">🛡️</div>
            <h1 className="admin-login__title">Secure Admin Access</h1>
            <p className="admin-login__subtitle">Voter Protocol Engine — Obsidian Gateway</p>

            <div className="admin-login__credential-box" role="note" aria-label="Evaluation Credentials">
              <span className="admin-login__credential-icon" aria-hidden="true">💡</span>
              <div className="admin-login__credential-text">
                Admin Username: admin<br />
                Admin Password: admin123
              </div>
            </div>

            <form
              onSubmit={(e) => void handleLogin(e)}
              className="admin-login__form"
              aria-label="Admin login form"
              noValidate
            >
              <div className="admin-login__field">
                <label htmlFor="admin-username" className="admin-login__label">
                  Username
                </label>
                <input
                  id="admin-username"
                  type="text"
                  className="admin-login__input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  aria-required="true"
                  aria-describedby={error ? 'admin-error' : undefined}
                  disabled={isSubmitting}
                />
              </div>

              <div className="admin-login__field">
                <label htmlFor="admin-password" className="admin-login__label">
                  Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  className="admin-login__input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  aria-required="true"
                  disabled={isSubmitting}
                />
              </div>

              {error && (
                <p
                  id="admin-error"
                  role="alert"
                  aria-live="assertive"
                  className="admin-login__error"
                >
                  ⚠️ {error}
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg admin-login__submit"
                disabled={isSubmitting || !username || !password}
                aria-busy={isSubmitting}
                aria-label="Sign in to admin dashboard"
              >
                {isSubmitting ? (
                  <>
                    <span className="btn-spinner" aria-hidden="true" />
                    Authenticating…
                  </>
                ) : (
                  '🔐 Sign In'
                )}
              </button>
            </form>

            <Link to="/" className="admin-login__back" aria-label="Return to main site">
              ← Back to Voter Protocol Engine
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────────────────
  return (
    <main className="admin-page" id="main-content" tabIndex={-1} aria-label="Admin dashboard">
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <header className="admin-dashboard__header">
        <div className="admin-dashboard__title-group">
          <span aria-hidden="true">🛡️</span>
          <h1 className="admin-dashboard__title">Secure Management Dashboard</h1>
        </div>
        <div className="admin-dashboard__actions">
          <Link to="/" className="btn btn-ghost btn-sm" aria-label="Return to main site">
            ← Main Site
          </Link>
          <button
            className="btn btn-danger btn-sm"
            onClick={handleLogout}
            aria-label="Sign out of admin dashboard"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="admin-dashboard__content">
        <section aria-label="System statistics" className="admin-dashboard__section">
          <h2 className="admin-dashboard__section-title">
            <span aria-hidden="true">📈</span> Live Statistics
            <span className="admin-dashboard__live-dot" aria-label="Live data" title="Live" />
          </h2>
          <div className="admin-dashboard__stats-grid">
            {MOCK_STATS.map((stat) => (
              <article
                key={stat.label}
                className="admin-stat-card"
                aria-label={`${stat.label}: ${stat.value}`}
              >
                <div className="admin-stat-card__icon" aria-hidden="true" style={{ color: stat.color }}>
                  {stat.icon}
                </div>
                <div className="admin-stat-card__value" style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <div className="admin-stat-card__label">{stat.label}</div>
              </article>
            ))}
          </div>
        </section>

        <section aria-label="Recent activity" className="admin-dashboard__section">
          <h2 className="admin-dashboard__section-title">
            <span aria-hidden="true">🕐</span> Recent Queries
          </h2>
          <table className="admin-table" aria-label="Recent civic data queries">
            <thead>
              <tr>
                <th scope="col">Address</th>
                <th scope="col">Mode</th>
                <th scope="col">Response (ms)</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { addr: 'Austin, TX', mode: '🇺🇸 US', ms: 340, status: '✅ OK' },
                { addr: 'Bengaluru, Karnataka', mode: '🇮🇳 India', ms: 820, status: '✅ OK' },
                { addr: 'Washington DC', mode: '🇺🇸 US', ms: 290, status: '✅ OK' },
                { addr: 'Odisha, India', mode: '🇮🇳 India', ms: 910, status: '✅ OK' },
                { addr: 'Chicago, IL', mode: '🇺🇸 US', ms: 410, status: '✅ OK' },
              ].map((row) => (
                <tr key={row.addr} className="admin-table__row">
                  <td className="admin-table__cell">{row.addr}</td>
                  <td className="admin-table__cell">{row.mode}</td>
                  <td className="admin-table__cell">{row.ms}</td>
                  <td className="admin-table__cell">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
};

export default AdminPage;
