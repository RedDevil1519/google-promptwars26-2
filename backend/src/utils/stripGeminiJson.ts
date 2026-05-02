/**
 * stripGeminiJson.ts
 *
 * Utility to extract raw JSON from Gemini model output.
 *
 * Gemini occasionally wraps its output in markdown code fences even when
 * instructed not to. This utility strips all of the following patterns:
 *
 *   ```json { ... } ```
 *   ```JSON { ... } ```
 *   ``` { ... } ```
 *   Plain { ... } (already clean — returned as-is)
 *
 * Additionally, if the model prefixes the fence with prose text
 * (e.g. "Here is the JSON:\n```json..."), only the content inside
 * the first code fence is extracted.
 *
 * @param raw - The raw string returned by model.generateContent()
 * @returns A clean JSON string ready for JSON.parse()
 */
export function stripGeminiJson(raw: string): string {
  const trimmed = raw.trim();

  // Pattern: extract everything between the first ``` fence and the last ```
  // Handles: ```json, ```JSON, ```typescript, ``` (bare), etc.
  const fenceMatch = trimmed.match(/^```[a-zA-Z]*\s*([\s\S]*?)```\s*$/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  // Pattern: opening fence with no closing (model truncated response)
  // Extract everything after the opening fence line
  const openFenceMatch = trimmed.match(/^```[a-zA-Z]*\s*([\s\S]+)$/);
  if (openFenceMatch) {
    return openFenceMatch[1].trim();
  }

  // Pattern: prose before a fence block — find first { and last }
  // e.g. "Here is the JSON:\n```json\n{...}\n```"
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  // Already clean — return as-is
  return trimmed;
}
