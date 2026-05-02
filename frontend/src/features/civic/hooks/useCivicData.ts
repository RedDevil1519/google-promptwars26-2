/**
 * useCivicData.ts
 *
 * Custom React hook for fetching election data from the Civic API proxy.
 *
 * Features:
 * - 24-hour localStorage caching via cache.ts
 * - Abort controller to cancel stale requests on unmount
 * - Typed return value with loading and error states
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import type { CivicApiResponse } from '../types';
import { cacheGet, cacheSet, civicCacheKey } from '@shared/utils/cache';

interface UseCivicDataState {
  /** The API response data, if available */
  data: CivicApiResponse | null;
  /** True while a network request is in flight */
  loading: boolean;
  /** Error message if the request failed */
  error: string | null;
  /** True if this data came from the cache */
  fromCache: boolean;
}

interface UseCivicDataResult extends UseCivicDataState {
  /** Call to re-fetch, bypassing the cache */
  refetch: () => void;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

/**
 * Fetches civic election data for the given address.
 *
 * Hits the backend proxy at /api/civic?address=<address>.
 * Caches the response in localStorage for 24 hours.
 *
 * @param address - The voter's address string (pre-sanitized)
 * @returns State object with data, loading, error, fromCache, and refetch
 *
 * @example
 * const { data, loading, error } = useCivicData('1600 Pennsylvania Ave NW, DC');
 */
export function useCivicData(address: string | null): UseCivicDataResult {
  const [state, setState] = useState<UseCivicDataState>({
    data: null,
    loading: false,
    error: null,
    fromCache: false,
  });

  // Use a ref to track the fetch version — allows ignoring stale responses
  const fetchVersion = useRef(0);

  const fetchData = useCallback(
    async (bypassCache = false) => {
      if (!address || address.trim().length === 0) {
        return;
      }

      const cacheKey = civicCacheKey(address);

      // Check cache first (unless bypassCache is set)
      if (!bypassCache) {
        const cached = cacheGet<CivicApiResponse>(cacheKey);
        if (cached) {
          setState({ data: cached, loading: false, error: null, fromCache: true });
          return;
        }
      }

      const currentVersion = ++fetchVersion.current;
      setState((prev) => ({ ...prev, loading: true, error: null, fromCache: false }));

      const controller = new AbortController();

      try {
        const url = `${API_BASE}/api/civic?address=${encodeURIComponent(address)}`;
        const response = await fetch(url, { signal: controller.signal });

        // Ignore stale responses if a newer fetch has been triggered
        if (currentVersion !== fetchVersion.current) {
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({})) as { error?: string };
          throw new Error(errorData.error ?? `HTTP ${response.status}`);
        }

        const data = await response.json() as CivicApiResponse;

        // Cache the successful response
        cacheSet(cacheKey, data);

        setState({ data, loading: false, error: null, fromCache: false });
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Request was cancelled — do not update state
          return;
        }
        const message = err instanceof Error ? err.message : 'Unknown error';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: `Failed to fetch civic data: ${message}`,
        }));
      }

      return () => controller.abort();
    },
    [address]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    void fetchData(true);
  }, [fetchData]);

  return { ...state, refetch };
}
