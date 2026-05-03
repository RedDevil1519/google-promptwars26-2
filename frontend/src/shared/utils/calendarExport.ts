/**
 * calendarExport.ts
 *
 * Generates and downloads a standards-compliant .ics (iCalendar) file
 * for an election event. Works offline — no API key required.
 *
 * RFC 5545 compliance: https://datatracker.ietf.org/doc/html/rfc5545
 */

/**
 * Options for generating an .ics event file.
 */
export interface ICSEventOptions {
  /** Event title shown in the calendar app */
  title: string;
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Optional plain-text description */
  description?: string;
  /** Optional location string */
  location?: string;
}

/**
 * Escapes special characters in iCalendar text values.
 * Commas, semicolons, and backslashes must be escaped per RFC 5545.
 *
 * @param text - Raw string to escape
 * @returns Escaped string safe for use in .ics files
 */
export function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Converts a YYYY-MM-DD date string to an iCalendar DATE value (YYYYMMDD).
 *
 * @param dateStr - ISO date string e.g. "2024-11-05"
 * @returns iCal date string e.g. "20241105", or null if invalid
 */
export function toICSDate(dateStr: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return null;
  return `${match[1]}${match[2]}${match[3]}`;
}

/**
 * Generates the raw text content of a standards-compliant .ics file
 * for an all-day event.
 *
 * @param options - ICSEventOptions
 * @returns .ics file content as a string, or null if date is invalid
 */
export function generateICS(options: ICSEventOptions): string | null {
  const { title, date, description = '', location = '' } = options;

  const startDate = toICSDate(date);
  if (!startDate) return null;

  // All-day event: DTEND is the next calendar day
  const nextDay = new Date(`${date}T00:00:00Z`);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const endDate = toICSDate(nextDay.toISOString().slice(0, 10));
  if (!endDate) return null;

  // UID: deterministic based on title + date (no random dependency for testability)
  const uid = `voter-protocol-${startDate}-${encodeURIComponent(title).slice(0, 20)}@voter-protocol.app`;

  const now = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Voter Protocol Engine//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${startDate}`,
    `DTEND;VALUE=DATE:${endDate}`,
    `SUMMARY:${escapeICSText(title)}`,
    description ? `DESCRIPTION:${escapeICSText(description)}` : '',
    location ? `LOCATION:${escapeICSText(location)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');

  return lines;
}

/**
 * Generates an .ics file and triggers a browser download for it.
 *
 * @param options - ICSEventOptions with event details
 * @param filename - Optional filename (defaults to election-reminder.ics)
 * @returns true if download was triggered, false if date was invalid
 */
export function downloadICS(options: ICSEventOptions, filename = 'election-reminder.ics'): boolean {
  const content = generateICS(options);
  if (!content) return false;

  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Release the object URL after a short delay
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
