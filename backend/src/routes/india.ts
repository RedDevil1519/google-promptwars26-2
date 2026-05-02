import { Router, type Request, type Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

// ── Strict Types ──────────────────────────────────────────────────────────────

/**
 * The structured JSON that Gemini returns for an Indian constituency.
 * All fields are optional to tolerate model variability; the mapper
 * applies sensible defaults when fields are missing.
 */
export interface IndiaElectionData {
  /** Name of the constituency or city */
  constituency?: string;
  /** State of the constituency */
  state?: string;
  /** Type of expected upcoming election, e.g. "Lok Sabha" or "State Assembly" */
  electionType?: string;
  /** Expected year of the next election */
  expectedElectionYear?: string | number;
  /** Steps for voter registration per ECI guidelines */
  voterRegistrationSteps?: string[];
  /** A brief summary of the standard election process */
  electionProcessSummary?: string;
  /** Phase-specific descriptions to map to the 4-phase roadmap */
  phases?: {
    authorization?: string;
    intelligence?: string;
    logistics?: string;
    execution?: string;
  };
}

/**
 * Geocoding result entry from the Google Maps Geocoding API.
 */
interface GeocodeResult {
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

/**
 * Response from Google Maps Geocoding API.
 */
interface GeocodeApiResponse {
  results: GeocodeResult[];
  status: string;
}

/**
 * The response shape returned by the /api/india endpoint.
 * This is designed to be directly mapped to CivicVoterInfo on the frontend.
 */
export interface IndiaApiResponse {
  /** Constant flag so the frontend can identify this as an India fallback */
  indiaFallback: true;
  /** The Gemini-generated election data */
  electionData: IndiaElectionData;
  /** Geocoded coordinates for the Map embed */
  coordinates: { lat: number; lng: number } | null;
  /** Formatted address string from geocoding */
  formattedAddress: string;
}

/**
 * Error response shape for the /api/india endpoint.
 */
export interface IndiaErrorResponse {
  error: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Extracts a specific address component type from a Geocoding result.
 *
 * @param result - A single geocoding result object
 * @param type - The address component type to extract (e.g., 'country')
 * @returns The long name of the matching component, or undefined
 */
function getAddressComponent(result: GeocodeResult, type: string): string | undefined {
  return result.address_components.find((c) => c.types.includes(type))?.long_name;
}

/**
 * Calls the Google Maps Geocoding API for the given address.
 * Returns the first geocoded result, or null if not found.
 *
 * @param address - The user's address string
 * @param apiKey - Google Maps API key
 * @returns The first GeocodeResult or null
 */
async function geocodeAddress(address: string, apiKey: string): Promise<GeocodeResult | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json() as GeocodeApiResponse;
  if (data.status !== 'OK' || data.results.length === 0) return null;
  return data.results[0];
}

/**
 * Determines whether a geocoded result is located in India.
 *
 * @param result - A geocoding result
 * @returns true if the country component is "India"
 */
function isInIndia(result: GeocodeResult): boolean {
  const country = getAddressComponent(result, 'country');
  return country === 'India';
}

/**
 * Builds a structured Gemini prompt for Indian civic election data.
 *
 * @param location - The city or constituency name
 * @param state - The state name (if available)
 * @returns A detailed prompt string
 */
function buildIndiaPrompt(location: string, state: string): string {
  return `You are an expert on the Indian electoral system and the Election Commission of India (ECI).

A voter is located in ${location}${state ? `, ${state}` : ''}, India.

Generate a JSON object with EXACTLY this structure — no extra text, markdown, or code fences:
{
  "constituency": "<name of the Lok Sabha or Vidhan Sabha constituency>",
  "state": "<state name>",
  "electionType": "<'Lok Sabha' or 'State Assembly (Vidhan Sabha)' — whichever is most imminent>",
  "expectedElectionYear": "<year as a string, e.g. '2029'>",
  "voterRegistrationSteps": [
    "<step 1>",
    "<step 2>",
    "<step 3>",
    "<step 4>"
  ],
  "electionProcessSummary": "<2-3 sentence summary of the Indian election process for this constituency>",
  "phases": {
    "authorization": "<description of voter ID and registration verification for this location>",
    "intelligence": "<description of how to research candidates and parties for this constituency>",
    "logistics": "<description of finding the polling booth, EVM use, and voting timeline>",
    "execution": "<description of how to cast a vote on election day in India>"
  }
}`;
}

// ── Route ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/india
 *
 * International Fallback Engine for Indian addresses.
 *
 * 1. Geocodes the address using the Google Maps Geocoding API.
 * 2. Verifies the location is in India.
 * 3. Calls Gemini 1.5 Flash with a structured ECI-based prompt.
 * 4. Returns the parsed IndiaApiResponse to the frontend.
 *
 * @body address - The user's search address string
 * @returns {IndiaApiResponse} Structured India election data + coordinates
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { address } = req.body as { address?: string };

  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    res.status(400).json({ error: 'Missing or invalid "address" field.' } satisfies IndiaErrorResponse);
    return;
  }

  const geocodeKey = process.env.GEOCODING_API_KEY ?? process.env.CIVIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!geminiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' } satisfies IndiaErrorResponse);
    return;
  }

  // ── Step 1: Geocode the address ──────────────────────────────────────────
  let coordinates: { lat: number; lng: number } | null = null;
  let formattedAddress = address.trim();
  let locationName = address.trim();
  let stateName = '';

  if (geocodeKey) {
    try {
      const geoResult = await geocodeAddress(address.trim(), geocodeKey);
      if (geoResult) {
        coordinates = {
          lat: geoResult.geometry.location.lat,
          lng: geoResult.geometry.location.lng,
        };
        formattedAddress = geoResult.formatted_address;
        locationName =
          getAddressComponent(geoResult, 'locality') ??
          getAddressComponent(geoResult, 'administrative_area_level_2') ??
          address.trim();
        stateName =
          getAddressComponent(geoResult, 'administrative_area_level_1') ?? '';
      }
    } catch (geoErr) {
      console.warn('[India Route] Geocoding failed, continuing without coordinates:', geoErr);
    }
  }

  // ── Step 2: Call Gemini ──────────────────────────────────────────────────
  try {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = buildIndiaPrompt(locationName, stateName);
    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();

    // Strip any accidental markdown code fences that the model may add
    const jsonText = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    let electionData: IndiaElectionData;
    try {
      electionData = JSON.parse(jsonText) as IndiaElectionData;
    } catch {
      console.error('[India Route] Failed to parse Gemini JSON:', jsonText);
      res.status(500).json({ error: 'Gemini returned an unexpected format. Please try again.' } satisfies IndiaErrorResponse);
      return;
    }

    const response: IndiaApiResponse = {
      indiaFallback: true,
      electionData,
      coordinates,
      formattedAddress,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('[India Route] Gemini API error:', error);
    res.status(500).json({ error: 'Failed to generate India election data. Please try again.' } satisfies IndiaErrorResponse);
  }
});

export default router;
