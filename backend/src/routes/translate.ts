import express, { type Request, type Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

/**
 * A single translation result as returned by the Google Cloud Translation API.
 */
interface TranslationResult {
  translatedText: string;
  detectedSourceLanguage?: string;
}

/**
 * The inner data envelope from the Cloud Translation API v2 response.
 */
interface TranslationResponseData {
  translations: TranslationResult[];
}

/**
 * The full response from the Cloud Translation API v2.
 */
interface CloudTranslationApiResponse {
  data: TranslationResponseData;
}

/**
 * Request body shape for the /api/translate endpoint.
 */
interface TranslateRequestBody {
  /** Array of strings to translate */
  q: string[];
  /** BCP-47 language code to translate into (e.g., 'es', 'hi') */
  target: string;
}

/**
 * Proxy route for Google Cloud Translation API.
 *
 * Accepts an array of strings and a target language, forwards them to
 * the Cloud Translation API, and returns the translated results.
 *
 * @route POST /api/translate
 * @body {TranslateRequestBody} q - array of strings; target - language code
 * @returns {CloudTranslationApiResponse} - Translation results from Google Cloud
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, target } = req.body as TranslateRequestBody;
    const apiKey = process.env.TRANSLATION_API_KEY;

    if (!apiKey) {
      res.status(500).json({ error: 'TRANSLATION_API_KEY is not configured.' });
      return;
    }

    if (!q || !Array.isArray(q) || q.length === 0) {
      res.status(400).json({ error: 'Missing or invalid "q" parameter. Expected array of strings.' });
      return;
    }

    if (!target) {
      res.status(400).json({ error: 'Missing "target" language code.' });
      return;
    }

    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q, target, format: 'text' }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[Translation API Error]', errorData);
      res.status(response.status).json({ error: 'Failed to fetch translations from Google Cloud.' });
      return;
    }

    const data = await response.json() as CloudTranslationApiResponse;
    res.json(data);
  } catch (error) {
    console.error('[Translation Route Error]', error);
    res.status(500).json({ error: 'Internal server error during translation.' });
  }
});

export default router;
