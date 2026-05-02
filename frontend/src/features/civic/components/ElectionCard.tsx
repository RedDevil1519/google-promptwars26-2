/**
 * ElectionCard.tsx
 *
 * Displays a single election with its name, date, and an "Add to Calendar" button.
 * Fully keyboard-navigable with proper aria attributes.
 */
import React from 'react';
import type { CivicElection } from '../types';
import { formatElectionDate, parseCivicDate, daysUntilElection } from '@shared/utils/dateParser';
import { useCalendarSync } from '../hooks/useCalendarSync';
import { Button } from '@shared/components/Button';

interface ElectionCardProps {
  election: CivicElection;
  /** Whether this is the currently focused/highlighted election */
  isHighlighted?: boolean;
}

/**
 * Card component for a single election.
 *
 * @example
 * <ElectionCard election={electionObj} isHighlighted={true} />
 */
export const ElectionCard: React.FC<ElectionCardProps> = ({
  election,
  isHighlighted = false,
}) => {
  const { openCalendarEvent } = useCalendarSync();

  const parsedDate = parseCivicDate(election.electionDay);
  const formattedDate = parsedDate ? formatElectionDate(parsedDate) : election.electionDay;
  const daysLeft = daysUntilElection(election.electionDay);

  const handleAddToCalendar = (): void => {
    openCalendarEvent({
      title: `🗳️ ${election.name}`,
      date: election.electionDay,
      description: `Election Day: ${formattedDate}. Division: ${election.ocdDivisionId}`,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAddToCalendar();
    }
  };

  return (
    <article
      className={`election-card ${isHighlighted ? 'election-card--highlighted' : ''}`}
      aria-label={`Election: ${election.name}`}
    >
      {/* Status badge */}
      {daysLeft !== null ? (
        <div
          className="election-card__badge election-card__badge--upcoming"
          aria-label={`${daysLeft} days until this election`}
        >
          <span aria-hidden="true">⏱</span> {daysLeft}d to go
        </div>
      ) : (
        <div
          className="election-card__badge election-card__badge--past"
          aria-label="This election has already occurred"
        >
          <span aria-hidden="true">✓</span> Past
        </div>
      )}

      <div className="election-card__body">
        <h3 className="election-card__title">{election.name}</h3>

        <dl className="election-card__meta">
          <dt className="sr-only">Election Date</dt>
          <dd className="election-card__date">
            <span aria-hidden="true">📅</span>{' '}
            <time dateTime={election.electionDay}>{formattedDate}</time>
          </dd>

          <dt className="sr-only">Division</dt>
          <dd className="election-card__division">
            <span aria-hidden="true">🏛</span> {election.ocdDivisionId}
          </dd>
        </dl>
      </div>

      <div className="election-card__actions">
        <Button
          variant="secondary"
          size="sm"
          aria-label={`Add ${election.name} to Google Calendar`}
          onClick={handleAddToCalendar}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <span aria-hidden="true">📅</span> Add to Calendar
        </Button>
      </div>
    </article>
  );
};
