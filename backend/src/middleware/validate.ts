import { Request, Response, NextFunction } from 'express';

/** Maximum length allowed for an address string */
const MAX_ADDRESS_LENGTH = 200;

/**
 * Express middleware that validates the `address` query parameter.
 *
 * Rules:
 * - Must be present and a non-empty string
 * - Must not exceed MAX_ADDRESS_LENGTH characters
 * - Must not contain script injection patterns
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Next middleware function
 */
export function validateAddress(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { address } = req.query;

  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    res.status(400).json({
      error: 'Query parameter "address" is required and must be a non-empty string.',
    });
    return;
  }

  if (address.length > MAX_ADDRESS_LENGTH) {
    res.status(400).json({
      error: `Address must not exceed ${MAX_ADDRESS_LENGTH} characters.`,
    });
    return;
  }

  // Detect obvious script injection attempts
  const scriptPattern = /<script[\s\S]*?>|javascript:/gi;
  if (scriptPattern.test(address)) {
    res.status(400).json({ error: 'Invalid characters in address.' });
    return;
  }

  // Attach sanitized address to req for downstream use
  (req as Request & { sanitizedAddress: string }).sanitizedAddress =
    address.trim().replace(/[<>"']/g, '');

  next();
}
