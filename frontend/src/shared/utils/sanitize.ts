/**
 * sanitize.ts
 *
 * A thin wrapper around DOMPurify for sanitizing user input strings.
 * Used in the AddressSearch component to prevent XSS before the
 * address is sent to the backend.
 */
import DOMPurify from 'dompurify';

/**
 * Sanitizes a raw user input string using DOMPurify.
 * Strips all HTML tags and potentially dangerous attributes.
 *
 * @param input - Raw string from a form input
 * @returns A safe, sanitized string suitable for use in API requests
 *
 * @example
 * sanitizeInput('<script>alert(1)</script>123 Main St')
 * // → '123 Main St'
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  // ALLOWED_TAGS: [] means strip all HTML, keeping only text content
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
}
