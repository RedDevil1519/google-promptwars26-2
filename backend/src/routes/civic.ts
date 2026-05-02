import { Router, Request, Response } from 'express';
import axios from 'axios';
import { validateAddress } from '../middleware/validate';

const router = Router();

/** Base URL for the Google Civic Information API */
const CIVIC_API_BASE = 'https://www.googleapis.com/civicinfo/v2';

/**
 * Typed request with the sanitized address attached by the validation middleware.
 */
type CivicRequest = Request & { sanitizedAddress: string };

/**
 * GET /api/civic
 *
 * Proxy endpoint that forwards address-based queries to the Google Civic
 * Information API. The API key is kept server-side; the frontend never
 * sees it.
 *
 * @query address - The voter's address string (validated by middleware)
 * @returns Civic API voterInfoQuery response or elections list
 */
router.get('/', validateAddress, async (req: Request, res: Response) => {
  const civicReq = req as CivicRequest;
  const apiKey = process.env.CIVIC_API_KEY;

  if (!apiKey) {
    console.error('[Civic Route] CIVIC_API_KEY is not set in environment.');
    res.status(500).json({
      error:
        'Server configuration error: Civic API key is missing. Check .env setup.',
    });
    return;
  }

  try {
    /**
     * First try voterInfoQuery — returns elections specific to the address.
     * Falls back to elections list if voterInfoQuery returns no results.
     */
    const voterInfoUrl = `${CIVIC_API_BASE}/voterinfo`;
    const voterInfoResponse = await axios.get(voterInfoUrl, {
      params: {
        key: apiKey,
        address: civicReq.sanitizedAddress,
        electionId: '2000', // 2000 = "test election" in the API; will be overridden
      },
      timeout: 10_000,
    });

    res.status(200).json(voterInfoResponse.data);
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status ?? 500;
      const message =
        err.response?.data?.error?.message ?? 'Civic API request failed';

      // 404 from Civic usually means no data for this address/election
      if (status === 404) {
        // Fall back: return the elections list so the UI can still show something
        try {
          const electionsUrl = `${CIVIC_API_BASE}/elections`;
          const electionsResponse = await axios.get(electionsUrl, {
            params: { key: apiKey },
            timeout: 10_000,
          });
          res.status(200).json({
            fallback: true,
            elections: electionsResponse.data.elections ?? [],
          });
          return;
        } catch (fallbackErr) {
          console.error('[Civic Route] Fallback elections fetch failed:', fallbackErr);
        }
      }

      console.error(`[Civic Route] Civic API error ${status}: ${message}`);
      res.status(status).json({ error: message });
    } else {
      console.error('[Civic Route] Unexpected error:', err);
      res.status(500).json({ error: 'An unexpected error occurred.' });
    }
  }
});

export default router;
