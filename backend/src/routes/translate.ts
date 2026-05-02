import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

/**
 * Proxy route for Google Cloud Translation API.
 * POST /api/translate
 * Body: { q: string[], target: 'hi' | 'es' }
 */
router.post('/', async (req, res) => {
  try {
    const { q, target } = req.body;
    const apiKey = process.env.TRANSLATION_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'TRANSLATION_API_KEY is not configured.' });
    }

    if (!q || !Array.isArray(q) || q.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid "q" parameter. Expected array of strings.' });
    }

    if (!target) {
      return res.status(400).json({ error: 'Missing "target" language code.' });
    }

    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q, target, format: 'text' }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Translation API Error]', errorData);
      return res.status(response.status).json({ error: 'Failed to fetch translations from Google Cloud.' });
    }

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error('[Translation Route Error]', error);
    return res.status(500).json({ error: 'Internal server error during translation.' });
  }
});

export default router;
