/**
 * PollingMap.test.tsx
 *
 * Component tests for the PollingMap component using React Testing Library.
 * Updated for the new free-embed PollingMap (no API key required).
 * The component now always renders the Google Maps iframe.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PollingMap } from './PollingMap';
import type { PollingLocation } from '../types';

/** Sample polling location with all optional fields populated */
const fullLocation: PollingLocation = {
  address: {
    locationName: 'City Hall',
    line1: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    zip: '62701',
  },
  pollingHours: '7am - 8pm',
  latitude: 39.7817,
  longitude: -89.6501,
};

/** Sample polling location with minimal fields and no hours */
const minimalLocation: PollingLocation = {
  address: {
    line1: '456 Oak Ave',
    city: 'Shelbyville',
    state: 'IL',
  },
};

describe('PollingMap', () => {

  beforeEach(() => {
    vi.stubEnv('VITE_MAPS_EMBED_KEY', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // ── Free embed branch (always renders iframe) ────────────────────────────

  describe('always shows map (free embed)', () => {
    it('renders polling location address text', () => {
      render(<PollingMap location={fullLocation} />);
      expect(screen.getByText(/City Hall/i)).toBeInTheDocument();
    });

    it('renders the "Polling Location" label', () => {
      render(<PollingMap location={fullLocation} />);
      expect(screen.getByText(/Polling Location/i)).toBeInTheDocument();
    });

    it('renders pollingHours when provided', () => {
      render(<PollingMap location={fullLocation} />);
      expect(screen.getByText(/7am - 8pm/i)).toBeInTheDocument();
    });

    it('does NOT render polling hours when omitted', () => {
      render(<PollingMap location={minimalLocation} />);
      expect(screen.queryByText(/hours/i)).not.toBeInTheDocument();
    });

    it('has an accessible aria-label on the map container', () => {
      render(<PollingMap location={fullLocation} />);
      const container = screen.getByLabelText(/Map showing polling location at City Hall/i);
      expect(container).toBeInTheDocument();
    });

    it('renders a formatted address string (no locationName)', () => {
      render(<PollingMap location={minimalLocation} />);
      expect(screen.getByText(/456 Oak Ave/)).toBeInTheDocument();
    });
  });

  // ── Iframe tests ────────────────────────────────────────────────────────

  describe('iframe embed', () => {
    it('renders an iframe', () => {
      render(<PollingMap location={fullLocation} />);
      const iframe = screen.getByTitle(/Map of polling location/i);
      expect(iframe).toBeInTheDocument();
      expect(iframe.tagName).toBe('IFRAME');
    });

    it('iframe uses address string in src (free embed uses q= param)', () => {
      render(<PollingMap location={fullLocation} />);
      const iframe = screen.getByTitle(/Map of polling location/i) as HTMLIFrameElement;
      expect(iframe.src).toContain('City%20Hall');
    });

    it('iframe falls back to address string when no coordinates', () => {
      render(<PollingMap location={minimalLocation} />);
      const iframe = screen.getByTitle(/Map of polling location/i) as HTMLIFrameElement;
      expect(iframe.src).toContain('456%20Oak%20Ave');
    });

    it('iframe has a descriptive title attribute', () => {
      render(<PollingMap location={fullLocation} />);
      const iframe = screen.getByTitle(/Map of polling location: City Hall/i);
      expect(iframe).toBeInTheDocument();
    });

    it('renders "Your Polling Location" label', () => {
      render(<PollingMap location={fullLocation} />);
      expect(screen.getByText(/Your Polling Location/i)).toBeInTheDocument();
    });

    it('renders pollingHours when provided', () => {
      render(<PollingMap location={fullLocation} />);
      expect(screen.getByText(/7am - 8pm/i)).toBeInTheDocument();
    });

    it('does not render polling hours when omitted', () => {
      render(<PollingMap location={minimalLocation} />);
      expect(screen.queryByText(/7am - 8pm/i)).not.toBeInTheDocument();
    });

    it('map container has an accessible aria-label', () => {
      render(<PollingMap location={fullLocation} />);
      expect(
        screen.getByLabelText(/Map showing polling location at City Hall/i)
      ).toBeInTheDocument();
    });

    it('renders a Google Maps link for the address', () => {
      render(<PollingMap location={fullLocation} />);
      const link = screen.getByRole('link', { name: /Open.*in Google Maps/i });
      expect(link).toHaveAttribute('href', expect.stringContaining('maps.google.com'));
    });
  });
});
