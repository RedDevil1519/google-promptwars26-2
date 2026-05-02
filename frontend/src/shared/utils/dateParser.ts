/**
 * dateParser.ts
 *
 * Utility functions for parsing, formatting, and validating election-related dates.
 * These functions are unit-tested in dateParser.test.ts.
 */

/**
 * Parses a date string in YYYY-MM-DD format and returns a Date object.
 * Returns null if the string is invalid or unparseable.
 *
 * @param dateStr - A date string, typically from the Civic API (e.g. "2024-11-05")
 * @returns A Date object representing the date, or null if invalid
 *
 * @example
 * parseCivicDate("2024-11-05") // → Date object for November 5, 2024
 * parseCivicDate("invalid")    // → null
 */
export function parseCivicDate(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') {
    return null;
  }

  // Strict YYYY-MM-DD format check
  const iso8601Pattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!iso8601Pattern.test(dateStr)) {
    return null;
  }

  // Parse as UTC to avoid timezone-offset issues where local time
  // might shift the date by one day
  const timestamp = Date.parse(`${dateStr}T00:00:00Z`);

  if (isNaN(timestamp)) {
    return null;
  }

  return new Date(timestamp);
}

/**
 * Formats a Date object into a human-readable string suitable for display
 * in the voter roadmap UI.
 *
 * @param date - A valid Date object
 * @param locale - Optional BCP 47 locale string (defaults to 'en-US')
 * @returns A formatted date string like "Tuesday, November 5, 2024"
 *
 * @example
 * formatElectionDate(new Date('2024-11-05T00:00:00Z'))
 * // → "Tuesday, November 5, 2024"
 */
export function formatElectionDate(date: Date, locale = 'en-US'): string {
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Converts a date string to a compact format used by the Google Calendar API.
 * The Calendar API requires dates in YYYYMMDD format.
 *
 * @param dateStr - A date string in YYYY-MM-DD format
 * @returns A compact date string like "20241105", or null if parsing fails
 *
 * @example
 * toCalendarDate("2024-11-05") // → "20241105"
 */
export function toCalendarDate(dateStr: string): string | null {
  const date = parseCivicDate(dateStr);
  if (!date) {
    return null;
  }
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * Determines whether an election date is in the future relative to now.
 *
 * @param dateStr - A date string in YYYY-MM-DD format
 * @returns true if the election is upcoming, false if past or invalid
 */
export function isUpcomingElection(dateStr: string): boolean {
  const date = parseCivicDate(dateStr);
  if (!date) {
    return false;
  }
  return date.getTime() > Date.now();
}

/**
 * Returns the number of days until an election date.
 * Returns null if the date is invalid or in the past.
 *
 * @param dateStr - A date string in YYYY-MM-DD format
 * @returns Number of days until the election, or null
 */
export function daysUntilElection(dateStr: string): number | null {
  const date = parseCivicDate(dateStr);
  if (!date) {
    return null;
  }
  const now = Date.now();
  const diff = date.getTime() - now;
  if (diff < 0) {
    return null;
  }
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
