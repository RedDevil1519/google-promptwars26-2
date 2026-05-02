/**
 * Civic data type definitions.
 *
 * These types mirror the Google Civic Information API v2 response shapes.
 * https://developers.google.com/civic-information/docs/v2/voterInfo/query
 */

/** A single election from the Civic API */
export interface CivicElection {
  id: string;
  name: string;
  /** ISO 8601 date string, e.g. "2024-11-05" */
  electionDay: string;
  ocdDivisionId: string;
}

/** A polling location from the Civic API */
export interface PollingLocation {
  address: {
    locationName?: string;
    line1?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  notes?: string;
  pollingHours?: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  latitude?: number;
  longitude?: number;
}

/** A contest/race on the ballot */
export interface Contest {
  office?: string;
  type?: string;
  candidates?: Candidate[];
  referendumTitle?: string;
  referendumSubtitle?: string;
  referendumBallotResponses?: string[];
}

/** A candidate in a contest */
export interface Candidate {
  name: string;
  party?: string;
  candidateUrl?: string;
  photoUrl?: string;
}

/** The full voterInfoQuery response */
export interface CivicVoterInfo {
  election: CivicElection;
  normalizedInput?: {
    line1?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  pollingLocations?: PollingLocation[];
  earlyVoteSites?: PollingLocation[];
  dropOffLocations?: PollingLocation[];
  contests?: Contest[];
  mailOnly?: boolean;
}

/** Fallback response when voterInfo is unavailable */
export interface CivicFallbackResponse {
  fallback: true;
  elections: CivicElection[];
}

/** Union type for all possible civic API responses */
export type CivicApiResponse = CivicVoterInfo | CivicFallbackResponse;

/** Type guard: checks if a response is the fallback elections list */
export function isFallbackResponse(
  response: CivicApiResponse
): response is CivicFallbackResponse {
  return 'fallback' in response && response.fallback === true;
}

/** Roadmap step definitions */
export interface RoadmapStep {
  id: number;
  title: string;
  description: string;
  deadline?: string;
  isCompleted: boolean;
  isCurrent: boolean;
}
