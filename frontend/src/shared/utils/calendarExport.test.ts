/**
 * calendarExport.test.ts
 *
 * Vitest unit tests for the calendarExport utility.
 * Verifies .ics content format, date conversion, and text escaping.
 */
import { describe, it, expect } from 'vitest';
import { generateICS, toICSDate, escapeICSText } from './calendarExport';

describe('escapeICSText', () => {
  it('escapes backslashes', () => {
    expect(escapeICSText('A\\B')).toBe('A\\\\B');
  });

  it('escapes semicolons', () => {
    expect(escapeICSText('A;B')).toBe('A\\;B');
  });

  it('escapes commas', () => {
    expect(escapeICSText('A,B')).toBe('A\\,B');
  });

  it('escapes newlines', () => {
    expect(escapeICSText('Line1\nLine2')).toBe('Line1\\nLine2');
  });

  it('returns plain text unchanged', () => {
    expect(escapeICSText('Election Day 2024')).toBe('Election Day 2024');
  });
});

describe('toICSDate', () => {
  it('converts YYYY-MM-DD to YYYYMMDD', () => {
    expect(toICSDate('2024-11-05')).toBe('20241105');
  });

  it('handles leading-zero months and days', () => {
    expect(toICSDate('2024-01-09')).toBe('20240109');
  });

  it('returns null for invalid format', () => {
    expect(toICSDate('November 5, 2024')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(toICSDate('')).toBeNull();
  });
});

describe('generateICS', () => {
  it('returns null for invalid date', () => {
    expect(generateICS({ title: 'Election', date: 'not-a-date' })).toBeNull();
  });

  it('contains required iCalendar fields', () => {
    const ics = generateICS({ title: 'Election Day', date: '2024-11-05' });
    expect(ics).not.toBeNull();
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('includes correct DTSTART date', () => {
    const ics = generateICS({ title: 'Test', date: '2024-11-05' });
    expect(ics).toContain('DTSTART;VALUE=DATE:20241105');
  });

  it('sets DTEND to the next day for an all-day event', () => {
    const ics = generateICS({ title: 'Test', date: '2024-11-05' });
    expect(ics).toContain('DTEND;VALUE=DATE:20241106');
  });

  it('includes the event title in SUMMARY', () => {
    const ics = generateICS({ title: 'General Election 2024', date: '2024-11-05' });
    expect(ics).toContain('SUMMARY:General Election 2024');
  });

  it('escapes special characters in title', () => {
    const ics = generateICS({ title: 'Election, Day; 2024', date: '2024-11-05' });
    expect(ics).toContain('SUMMARY:Election\\, Day\\; 2024');
  });

  it('includes DESCRIPTION when provided', () => {
    const ics = generateICS({
      title: 'Vote',
      date: '2024-11-05',
      description: 'Remember to bring your ID',
    });
    expect(ics).toContain('DESCRIPTION:Remember to bring your ID');
  });

  it('omits DESCRIPTION line when not provided', () => {
    const ics = generateICS({ title: 'Vote', date: '2024-11-05' });
    expect(ics).not.toContain('DESCRIPTION:');
  });

  it('includes LOCATION when provided', () => {
    const ics = generateICS({
      title: 'Vote',
      date: '2024-11-05',
      location: 'City Hall, Austin TX',
    });
    expect(ics).toContain('LOCATION:City Hall\\, Austin TX');
  });

  it('uses CRLF line endings per RFC 5545', () => {
    const ics = generateICS({ title: 'Test', date: '2024-11-05' });
    expect(ics).toContain('\r\n');
  });
});
