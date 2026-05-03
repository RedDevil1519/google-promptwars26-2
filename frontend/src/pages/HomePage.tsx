/**
 * HomePage.tsx
 *
 * The landing page of the Voter Protocol Engine.
 * Contains the hero section and address search form.
 * When an address is submitted, navigates to the ElectionPage.
 */
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AddressSearch } from '@features/search/components/AddressSearch';

/**
 * HomePage component — renders the hero and search UI.
 */
const HomePage: React.FC = () => {
  const navigate = useNavigate();

  /**
   * Handles address submission from the search form.
   * URL-encodes the address and navigates to the election results page.
   *
   * @param address - The sanitized address string
   */
  const handleSearch = (address: string): void => {
    void navigate(`/election?address=${encodeURIComponent(address)}`);
  };

  return (
    <main className="home-page" id="main-content" tabIndex={-1}>
      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="skip-link"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>

      <div className="home-page__hero">
        <div className="home-page__hero-glow" aria-hidden="true" />

        <header className="home-page__header">
          <div className="home-page__header-top">
            <div className="home-page__logo" aria-hidden="true">⚡</div>
            <Link to="/admin" className="btn btn-secondary btn-sm home-page__admin-btn" aria-label="Admin login">
              Admin Login
            </Link>
          </div>
          <h1 className="home-page__title">
            Voter Protocol{' '}
            <span className="home-page__title-accent">Engine</span>
          </h1>
          <p className="home-page__subtitle">
            Your civic intelligence system. Find local elections, understand your
            voter roadmap, and sync key deadlines to your calendar — all in one
            place.
          </p>
        </header>

        <div className="home-page__search-container">
          <AddressSearch onSearch={handleSearch} />
        </div>

        <nav className="home-page__features" aria-label="Key features">
          {[
            { icon: '🗳️', label: 'Local Elections', desc: 'Real-time civic data', href: '/election?address=Washington+DC' },
            { icon: '🗺️', label: 'Voter Roadmap', desc: 'Step-by-step guide', href: '/election?address=Austin+TX' },
            { icon: '📅', label: 'Calendar Sync', desc: '.ics + Google Calendar', href: '/election?address=New+York+NY' },
            { icon: '📍', label: 'Polling Map', desc: 'Find your location', href: '/election?address=Chicago+IL' },
          ].map((feature) => (
            <a
              key={feature.label}
              href={feature.href}
              className="home-page__feature-card"
              aria-label={`${feature.label}: ${feature.desc}`}
            >
              <span className="home-page__feature-icon" aria-hidden="true">
                {feature.icon}
              </span>
              <strong className="home-page__feature-label">{feature.label}</strong>
              <span className="home-page__feature-desc">{feature.desc}</span>
            </a>
          ))}
        </nav>
      </div>

      {/* Animated background particles — decorative */}
      <div className="home-page__particles" aria-hidden="true">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="particle" style={{ '--i': i } as React.CSSProperties} />
        ))}
      </div>
    </main>
  );
};

export default HomePage;
