/**
 * ElectionPage.tsx
 *
 * Displays election results for the searched address.
 * Renders election cards, the voter roadmap, and optional polling map.
 */
import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useCivicData } from '@features/civic/hooks/useCivicData';
import { ElectionCard } from '@features/civic/components/ElectionCard';
import { RoadmapStepper, DEFAULT_ROADMAP_STEPS } from '@features/civic/components/RoadmapStepper';
import { PollingMap } from '@features/civic/components/PollingMap';
import { Spinner } from '@shared/components/Spinner';
import { isFallbackResponse } from '@features/civic/types';
import type { CivicVoterInfo } from '@features/civic/types';

/**
 * ElectionPage reads the `address` query parameter and fetches civic data.
 */
const ElectionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const address = searchParams.get('address') ?? '';

  const { data, loading, error, fromCache, refetch } = useCivicData(address || null);

  const voterInfo = data && !isFallbackResponse(data) ? (data as CivicVoterInfo) : null;
  const fallbackElections = data && isFallbackResponse(data) ? data.elections : null;

  return (
    <main className="election-page" id="main-content" tabIndex={-1}>
      {/* Skip link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Header bar */}
      <header className="election-page__header">
        <Link to="/" className="election-page__back" aria-label="Back to home">
          <span aria-hidden="true">←</span> Home
        </Link>
        <div className="election-page__address-pill" aria-label={`Showing results for: ${address}`}>
          <span aria-hidden="true">📍</span> {address}
        </div>
        {fromCache && (
          <span className="election-page__cache-badge" aria-label="Results loaded from cache">
            ⚡ Cached
          </span>
        )}
        <button
          className="btn btn-ghost btn-sm"
          onClick={refetch}
          aria-label="Refresh election data"
          tabIndex={0}
        >
          🔄 Refresh
        </button>
      </header>

      <div className="election-page__content">
        {/* Loading state */}
        {loading && (
          <div className="election-page__loading">
            <Spinner label="Loading election data for your address..." size={56} />
            <p className="election-page__loading-text">
              Fetching civic data for <strong>{address}</strong>…
            </p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div role="alert" aria-live="assertive" className="election-page__error">
            <div className="election-page__error-icon" aria-hidden="true">⚠️</div>
            <h2>Could not load election data</h2>
            <p>{error}</p>
            <button
              className="btn btn-primary btn-md"
              onClick={refetch}
              aria-label="Try loading election data again"
              tabIndex={0}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty state — no address provided */}
        {!address && !loading && (
          <div className="election-page__empty">
            <p>No address provided. <Link to="/">Go back</Link> and enter your address.</p>
          </div>
        )}

        {/* Main content — voter info available */}
        {voterInfo && !loading && (
          <div className="election-page__results">
            {/* Election info */}
            <section aria-label="Your upcoming election" className="election-page__section">
              <h2 className="election-page__section-title">
                <span aria-hidden="true">🗳️</span> Your Election
              </h2>
              <ElectionCard election={voterInfo.election} isHighlighted />
            </section>

            {/* Voter Roadmap */}
            <section className="election-page__section" aria-label="Voter roadmap">
              <RoadmapStepper
                steps={DEFAULT_ROADMAP_STEPS}
                electionName={voterInfo.election.name}
              />
            </section>

            {/* Polling locations */}
            {voterInfo.pollingLocations && voterInfo.pollingLocations.length > 0 && (
              <section className="election-page__section" aria-label="Polling location">
                <h2 className="election-page__section-title">
                  <span aria-hidden="true">📍</span> Your Polling Location
                </h2>
                <PollingMap location={voterInfo.pollingLocations[0]} />
              </section>
            )}

            {/* Contests / ballot items */}
            {voterInfo.contests && voterInfo.contests.length > 0 && (
              <section className="election-page__section" aria-label="Ballot items">
                <h2 className="election-page__section-title">
                  <span aria-hidden="true">📋</span> Your Ballot
                </h2>
                <ul className="contest-list" aria-label="Contests and races on your ballot">
                  {voterInfo.contests.map((contest, i) => (
                    <li key={i} className="contest-item">
                      <strong>{contest.office ?? contest.referendumTitle ?? 'Contest'}</strong>
                      {contest.candidates && contest.candidates.length > 0 && (
                        <ul className="candidate-list" aria-label="Candidates">
                          {contest.candidates.map((c) => (
                            <li key={c.name} className="candidate-item">
                              {c.name}{c.party && <span className="candidate-party"> ({c.party})</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {/* Fallback — show list of all elections */}
        {fallbackElections && !loading && (
          <div className="election-page__results">
            <div
              role="status"
              aria-live="polite"
              className="election-page__fallback-notice"
            >
              <span aria-hidden="true">ℹ️</span> No specific voter info found for your
              address. Showing upcoming elections in your state.
            </div>

            <section aria-label="Upcoming elections" className="election-page__section">
              <h2 className="election-page__section-title">Upcoming Elections</h2>
              <div className="election-page__grid">
                {fallbackElections.map((election) => (
                  <ElectionCard key={election.id} election={election} />
                ))}
              </div>
            </section>

            <section className="election-page__section" aria-label="Voter roadmap">
              <RoadmapStepper steps={DEFAULT_ROADMAP_STEPS} />
            </section>
          </div>
        )}
      </div>
    </main>
  );
};

export default ElectionPage;
