/**
 * dateParser.test.ts
 *
 * Unit tests for the dateParser utility functions.
 * Tests cover happy paths, edge cases, invalid inputs, and timezone behaviour.
 */
import { describe, it, expect } from 'vitest';
import {
  parseCivicDate,
  formatElectionDate,
  toCalendarDate,
  isUpcomingElection,
  daysUntilElection,
} from './dateParser';

// ── parseCivicDate ────────────────────────────────────────────────

describe('parseCivicDate', () => {
  it('parses a valid ISO date string', () => {
    const result = parseCivicDate('2024-11-05');
    expect(result).toBeInstanceOf(Date);
    expect(result?.getUTCFullYear()).toBe(2024);
    expect(result?.getUTCMonth()).toBe(10); // 0-indexed
    expect(result?.getUTCDate()).toBe(5);
  });

  it('returns null for an empty string', () => {
    expect(parseCivicDate('')).toBeNull();
  });

  it('returns null for a non-date string', () => {
    expect(parseCivicDate('invalid-date')).toBeNull();
  });

  it('returns null for a partial date (missing day)', () => {
    expect(parseCivicDate('2024-11')).toBeNull();
  });

  it('returns null for a wrong-format date', () => {
    expect(parseCivicDate('11/05/2024')).toBeNull();
  });

  it('returns null for an impossible date', () => {
    expect(parseCivicDate('2024-13-01')).toBeNull();
  });

  it('handles leap year correctly', () => {
    const result = parseCivicDate('2024-02-29');
    expect(result).toBeInstanceOf(Date);
    expect(result?.getUTCDate()).toBe(29);
  });

  it('parses date as UTC (no timezone shift)', () => {
    const result = parseCivicDate('2024-01-01');
    // The day should still be 1 when read as UTC
    expect(result?.getUTCDate()).toBe(1);
  });
});

// ── formatElectionDate ────────────────────────────────────────────

describe('formatElectionDate', () => {
  it('formats a date in human-readable en-US format', () => {
    const date = new Date('2024-11-05T00:00:00Z');
    const result = formatElectionDate(date, 'en-US');
    // Should contain the full date parts
    expect(result).toContain('2024');
    expect(result).toContain('November');
    expect(result).toContain('5');
  });

  it('includes the weekday', () => {
    const date = new Date('2024-11-05T00:00:00Z');
    const result = formatElectionDate(date, 'en-US');
    expect(result).toContain('Tuesday');
  });
});

// ── toCalendarDate ────────────────────────────────────────────────

describe('toCalendarDate', () => {
  it('converts a valid date to YYYYMMDD format', () => {
    expect(toCalendarDate('2024-11-05')).toBe('20241105');
  });

  it('returns null for an invalid date', () => {
    expect(toCalendarDate('not-a-date')).toBeNull();
  });

  it('handles single-digit months and days', () => {
    expect(toCalendarDate('2024-01-09')).toBe('20240109');
  });
});

// ── isUpcomingElection ────────────────────────────────────────────

describe('isUpcomingElection', () => {
  it('returns true for a future date', () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    expect(isUpcomingElection(futureDate)).toBe(true);
  });

  it('returns false for a past date', () => {
    expect(isUpcomingElection('2020-01-01')).toBe(false);
  });

  it('returns false for an invalid date string', () => {
    expect(isUpcomingElection('bad-date')).toBe(false);
  });
});

// ── daysUntilElection ─────────────────────────────────────────────

describe('daysUntilElection', () => {
  it('returns a positive number for a future election', () => {
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const days = daysUntilElection(futureDate);
    expect(days).not.toBeNull();
    expect(days as number).toBeGreaterThan(0);
    expect(days as number).toBeLessThanOrEqual(11);
  });

  it('returns null for a past election', () => {
    expect(daysUntilElection('2020-01-01')).toBeNull();
  });

  it('returns null for an invalid date', () => {
    expect(daysUntilElection('invalid')).toBeNull();
  });
});
