/**
 * PollingMap.tsx
 *
 * Renders an interactive map for a polling location using the free
 * Google Maps embed (no API key required).
 *
 * Uses: https://maps.google.com/maps?q={address}&output=embed
 * Provides an accessible link fallback and address display.
 */
import React from 'react';
import type { PollingLocation } from '../types';

interface PollingMapProps {
  /** Polling location data from the Civic API or address string for search */
  location: PollingLocation;
}

/**
 * Formats a PollingLocation address object into a single query string.
 */
function formatAddress(location: PollingLocation): string {
  const { address } = location;
  return [
    address.locationName,
    address.line1,
    address.city,
    address.state,
    address.zip,
  ]
    .filter(Boolean)
    .join(', ');
}

/**
 * Renders a Google Maps iframe embed for the given polling location.
 * Uses the free embed URL — no VITE_MAPS_EMBED_KEY required.
 *
 * @example
 * <PollingMap location={pollingLocations[0]} />
 */
export const PollingMap: React.FC<PollingMapProps> = ({ location }) => {
  const addressStr = formatAddress(location);
  const encodedAddress = encodeURIComponent(addressStr);

  // Free embed — no API key needed
  const embedUrl = `https://maps.google.com/maps?q=${encodedAddress}&output=embed&z=14`;
  const mapsLink = `https://maps.google.com/?q=${encodedAddress}`;

  return (
    <div
      className="polling-map"
      aria-label={`Map showing polling location at ${addressStr}`}
    >
      <p className="polling-map__label">
        <span aria-hidden="true">📍</span> Your Polling Location
      </p>

      <div className="polling-map__embed-container">
        <iframe
          title={`Map of polling location: ${addressStr}`}
          className="polling-map__iframe"
          src={embedUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          aria-label={`Google Map showing ${addressStr}`}
          tabIndex={0}
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      </div>

      <address className="polling-map__address">
        <a
          href={mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${addressStr} in Google Maps`}
          style={{ color: 'var(--accent)', textDecoration: 'underline' }}
        >
          {addressStr} ↗
        </a>
      </address>

      {location.pollingHours && (
        <p className="polling-map__hours">
          <span aria-hidden="true">🕐</span> Hours: {location.pollingHours}
        </p>
      )}
    </div>
  );
};
