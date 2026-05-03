import { Router, type Request, type Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

/**
 * Response shape returned by the /api/explain endpoint.
 */
export interface ExplainResponse {
  term: string;
  explanation: string;
}

/**
 * Error response shape.
 */
export interface ExplainErrorResponse {
  error: string;
}

/**
 * POST /api/explain
 *
 * Uses the Gemini AI model to generate a plain-English (ELI5) definition
 * of a complex civic or legal term. The Gemini API key is kept server-side.
 *
 * @body term - The civic term to explain (string, max 200 chars)
 * @returns {ExplainResponse} JSON with the term and its ELI5 explanation
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { term } = req.body as { term?: string };

  if (!term || typeof term !== 'string' || term.trim().length === 0) {
    res.status(400).json({ error: 'Missing or invalid "term" field. Expected a non-empty string.' } satisfies ExplainErrorResponse);
    return;
  }

  if (term.trim().length > 200) {
    res.status(400).json({ error: '"term" must be 200 characters or fewer.' } satisfies ExplainErrorResponse);
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' } satisfies ExplainErrorResponse);
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT' as any, threshold: 'BLOCK_NONE' as any },
        { category: 'HARM_CATEGORY_HATE_SPEECH' as any, threshold: 'BLOCK_NONE' as any },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' as any, threshold: 'BLOCK_NONE' as any },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT' as any, threshold: 'BLOCK_NONE' as any },
      ],
    });

    const prompt = `You are a helpful civic educator. A voter needs a simple, clear explanation of the following civic or legal term.
Explain it like they are 5 years old — use plain language, a short analogy, and NO jargon.
Keep your answer under 60 words.

Term: "${term.trim()}"`;

    const result = await model.generateContent(prompt);
    const explanation = result.response.text().trim();

    res.status(200).json({ term: term.trim(), explanation } satisfies ExplainResponse);
  } catch (error) {
    console.error('[Explain Route] Gemini API error:', error);
    res.status(500).json({ error: 'Failed to generate explanation. Please try again.' } satisfies ExplainErrorResponse);
  }
});

export default router;
