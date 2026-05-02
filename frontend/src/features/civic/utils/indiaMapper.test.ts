/**
 * indiaMapper.test.ts
 *
 * Unit tests for the India Fallback Engine mapper utilities.
 * Verifies that IndiaApiResponse objects are correctly converted into
 * CivicVoterInfo, CivicElection, and RoadmapStep arrays.
 */
import { describe, it, expect } from 'vitest';
import {
  mapIndiaToRoadmapSteps,
  mapIndiaToCivicElection,
  mapIndiaToCivicVoterInfo,
} from './indiaMapper';
import type { IndiaApiResponse } from '../types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

/** Full IndiaApiResponse with all optional fields populated */
const fullResponse: IndiaApiResponse = {
  indiaFallback: true,
  formattedAddress: 'Bhubaneswar, Odisha, India',
  coordinates: { lat: 20.2961, lng: 85.8245 },
  electionData: {
    constituency: 'Bhubaneswar Lok Sabha Constituency',
    state: 'Odisha',
    electionType: 'Lok Sabha',
    expectedElectionYear: '2029',
    voterRegistrationSteps: ['Step 1', 'Step 2', 'Step 3'],
    electionProcessSummary: 'Voters cast ballots using EVM machines at designated booths.',
    phases: {
      authorization: 'Verify your EPIC card and name on the Electoral Roll.',
      intelligence: 'Research candidates on the ECI portal and KnowYourCandidate.',
      logistics: 'Find your polling booth via Voter Helpline 1950.',
      execution: 'Visit your booth, present your ID, and use the EVM to vote.',
    },
  },
};

/** Minimal IndiaApiResponse with no optional fields */
const minimalResponse: IndiaApiResponse = {
  indiaFallback: true,
  formattedAddress: 'Delhi, India',
  coordinates: null,
  electionData: {},
};

// ── mapIndiaToRoadmapSteps ────────────────────────────────────────────────────

describe('mapIndiaToRoadmapSteps', () => {
  it('returns exactly 4 roadmap steps', () => {
    const steps = mapIndiaToRoadmapSteps(fullResponse);
    expect(steps).toHaveLength(4);
  });

  it('uses Gemini-generated phase descriptions when available', () => {
    const steps = mapIndiaToRoadmapSteps(fullResponse);
    expect(steps[0].description).toBe('Verify your EPIC card and name on the Electoral Roll.');
    expect(steps[1].description).toBe('Research candidates on the ECI portal and KnowYourCandidate.');
    expect(steps[2].description).toBe('Find your polling booth via Voter Helpline 1950.');
    expect(steps[3].description).toBe('Visit your booth, present your ID, and use the EVM to vote.');
  });

  it('falls back to ECI default descriptions when phases are missing', () => {
    const steps = mapIndiaToRoadmapSteps(minimalResponse);
    expect(steps[0].description).toContain('Voter ID card (EPIC)');
    expect(steps[1].description).toContain('ECI Voter Helpline App');
    expect(steps[2].description).toContain('Voter Helpline (1950)');
    expect(steps[3].description).toContain('Electronic Voting Machine (EVM)');
  });

  it('marks step 1 as isCurrent=true', () => {
    const steps = mapIndiaToRoadmapSteps(fullResponse);
    expect(steps[0].isCurrent).toBe(true);
    expect(steps[1].isCurrent).toBe(false);
    expect(steps[2].isCurrent).toBe(false);
    expect(steps[3].isCurrent).toBe(false);
  });

  it('marks all steps as isCompleted=false', () => {
    const steps = mapIndiaToRoadmapSteps(fullResponse);
    steps.forEach((s) => expect(s.isCompleted).toBe(false));
  });

  it('assigns sequential ids 1-4', () => {
    const steps = mapIndiaToRoadmapSteps(fullResponse);
    expect(steps.map((s) => s.id)).toEqual([1, 2, 3, 4]);
  });

  it('includes Hindi phase names in step titles', () => {
    const steps = mapIndiaToRoadmapSteps(fullResponse);
    expect(steps[0].title).toContain('Authorization');
    expect(steps[3].title).toContain('Execution');
  });
});

// ── mapIndiaToCivicElection ───────────────────────────────────────────────────

describe('mapIndiaToCivicElection', () => {
  it('creates a CivicElection with the correct name', () => {
    const election = mapIndiaToCivicElection(fullResponse);
    expect(election.name).toContain('Lok Sabha');
    expect(election.name).toContain('Bhubaneswar Lok Sabha Constituency');
  });

  it('uses the expectedElectionYear in electionDay', () => {
    const election = mapIndiaToCivicElection(fullResponse);
    expect(election.electionDay).toContain('2029');
  });

  it('falls back to "Upcoming" when no election year is provided', () => {
    const election = mapIndiaToCivicElection(minimalResponse);
    expect(election.electionDay).toContain('Upcoming');
  });

  it('uses formattedAddress as constituency when all optional fields are missing', () => {
    const election = mapIndiaToCivicElection(minimalResponse);
    expect(election.name).toContain('Delhi, India');
  });

  it('always uses the india-gemini-fallback id', () => {
    const election = mapIndiaToCivicElection(fullResponse);
    expect(election.id).toBe('india-gemini-fallback');
  });
});

// ── mapIndiaToCivicVoterInfo ──────────────────────────────────────────────────

describe('mapIndiaToCivicVoterInfo', () => {
  it('returns a CivicVoterInfo with a valid election', () => {
    const info = mapIndiaToCivicVoterInfo(fullResponse);
    expect(info.election).toBeDefined();
    expect(info.election.name).toContain('Lok Sabha');
  });

  it('includes one synthetic polling location', () => {
    const info = mapIndiaToCivicVoterInfo(fullResponse);
    expect(info.pollingLocations).toHaveLength(1);
  });

  it('includes coordinates in the polling location when available', () => {
    const info = mapIndiaToCivicVoterInfo(fullResponse);
    expect(info.pollingLocations![0].latitude).toBe(20.2961);
    expect(info.pollingLocations![0].longitude).toBe(85.8245);
  });

  it('does not include coordinates when they are null', () => {
    const info = mapIndiaToCivicVoterInfo(minimalResponse);
    expect(info.pollingLocations![0].latitude).toBeUndefined();
    expect(info.pollingLocations![0].longitude).toBeUndefined();
  });

  it('sets mailOnly to false', () => {
    const info = mapIndiaToCivicVoterInfo(fullResponse);
    expect(info.mailOnly).toBe(false);
  });

  it('sets pollingHours to ECI schedule text', () => {
    const info = mapIndiaToCivicVoterInfo(fullResponse);
    expect(info.pollingLocations![0].pollingHours).toContain('ECI');
  });

  it('returns empty contests array', () => {
    const info = mapIndiaToCivicVoterInfo(fullResponse);
    expect(info.contests).toEqual([]);
  });
});
