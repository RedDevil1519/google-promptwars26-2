/**
 * useCalendarSync.ts
 *
 * Custom React hook that generates Google Calendar event links for election deadlines.
 * No OAuth is required — the link opens in a new tab and pre-fills the event form.
 */
import { useCallback } from 'react';
import { toCalendarDate } from '@shared/utils/dateParser';

interface CalendarEventOptions {
  /** Event title shown in Google Calendar */
  title: string;
  /** Event date in YYYY-MM-DD format */
  date: string;
  /** Optional event description */
  description?: string;
  /** Optional event location (polling address) */
  location?: string;
}

interface UseCalendarSyncResult {
  /**
   * Returns a Google Calendar "render" URL for the given event options.
   * Returns null if the date is invalid.
   */
  buildCalendarLink: (options: CalendarEventOptions) => string | null;
  /**
   * Opens the Google Calendar link in a new tab.
   */
  openCalendarEvent: (options: CalendarEventOptions) => void;
}

/**
 * Hook for generating and opening Google Calendar event links.
 *
 * The generated URL follows the Google Calendar deep-link format:
 * https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=...
 *
 * @returns Object with buildCalendarLink and openCalendarEvent functions
 *
 * @example
 * const { openCalendarEvent } = useCalendarSync();
 * openCalendarEvent({ title: 'Election Day', date: '2024-11-05' });
 */
export function useCalendarSync(): UseCalendarSyncResult {
  const buildCalendarLink = useCallback((options: CalendarEventOptions): string | null => {
    const { title, date, description = '', location = '' } = options;

    const calDate = toCalendarDate(date);
    if (!calDate) {
      return null;
    }

    // For an all-day event, end date is the next day
    const nextDayDate = toCalendarDate(
      new Date(new Date(`${date}T00:00:00Z`).getTime() + 86400000)
        .toISOString()
        .slice(0, 10)
    );

    if (!nextDayDate) {
      return null;
    }

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: `${calDate}/${nextDayDate}`,
      details: description,
      location,
      sf: 'true',
      output: 'xml',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }, []);

  const openCalendarEvent = useCallback(
    (options: CalendarEventOptions): void => {
      const link = buildCalendarLink(options);
      if (link) {
        window.open(link, '_blank', 'noopener,noreferrer');
      }
    },
    [buildCalendarLink]
  );

  return { buildCalendarLink, openCalendarEvent };
}
