/**
 * PollingMap.tsx
 *
 * Optional Google Maps embed component that displays a polling location.
 * Only renders when a VITE_MAPS_EMBED_KEY environment variable is set.
 */
import React from 'react';
import type { PollingLocation } from '../types';

interface PollingMapProps {
  /** Polling location data from the Civic API */
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
 * Falls back to a text address display if no API key is configured.
 *
 * @example
 * <PollingMap location={pollingLocations[0]} />
 */
export const PollingMap: React.FC<PollingMapProps> = ({ location }) => {
  const mapsKey = import.meta.env.VITE_MAPS_EMBED_KEY as string | undefined;
  const addressStr = formatAddress(location);
  const encodedAddress = encodeURIComponent(addressStr);

  if (!mapsKey) {
    // Graceful degradation — show text address without the map
    return (
      <div className="polling-map polling-map--text" aria-label="Polling location address">
        <p className="polling-map__label">
          <span aria-hidden="true">📍</span> Polling Location
        </p>
        <address className="polling-map__address">{addressStr}</address>
        {location.pollingHours && (
          <p className="polling-map__hours">
            <span aria-hidden="true">🕐</span> Hours: {location.pollingHours}
          </p>
        )}
      </div>
    );
  }

  // Use latitude and longitude if available, otherwise fallback to the address string
  // Google Maps Embed API supports address string for streetview location but lat/lng is more precise.
  const locationParam = location.latitude && location.longitude 
    ? `${location.latitude},${location.longitude}` 
    : encodedAddress;

  const embedUrl =
    `https://www.google.com/maps/embed/v1/streetview` +
    `?key=${mapsKey}&location=${locationParam}`;

  return (
    <div className="polling-map" aria-label={`Map showing polling location at ${addressStr}`}>
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
        />
      </div>
      <address className="polling-map__address">{addressStr}</address>
      {location.pollingHours && (
        <p className="polling-map__hours">
          <span aria-hidden="true">🕐</span> Hours: {location.pollingHours}
        </p>
      )}
    </div>
  );
};
