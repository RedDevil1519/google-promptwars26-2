/**
 * indiaMapper.ts
 *
 * Maps the Gemini-generated IndiaApiResponse into the existing UI data shapes
 * (RoadmapStep[] and a synthetic CivicElection) so that ElectionPage.tsx
 * renders identically regardless of the data source.
 */
import type { RoadmapStep, CivicElection, CivicVoterInfo, IndiaApiResponse } from '../types';

/**
 * Maps an IndiaApiResponse to a RoadmapStep array using the Gemini-generated
 * phase descriptions. Falls back to sensible ECI-specific defaults when
 * Gemini omits a field.
 *
 * @param data - The IndiaApiResponse from the /api/india endpoint
 * @returns An array of 4 RoadmapStep objects for the voter roadmap
 */
export function mapIndiaToRoadmapSteps(data: IndiaApiResponse): RoadmapStep[] {
  const { electionData } = data;
  const phases = electionData.phases ?? {};

  return [
    {
      id: 1,
      title: 'Phase 1: Authorization (मतदाता पंजीकरण)',
      description:
        phases.authorization ??
        'Verify your Voter ID card (EPIC) is valid and your name appears on the Electoral Roll at your local Electoral Registration Office (ERO) or online at voters.eci.gov.in.',
      isCompleted: false,
      isCurrent: true,
    },
    {
      id: 2,
      title: 'Phase 2: Intelligence (उम्मीदवार अनुसंधान)',
      description:
        phases.intelligence ??
        'Research candidates and political parties contesting in your constituency using the ECI Voter Helpline App or the KnowYourCandidate portal.',
      isCompleted: false,
      isCurrent: false,
    },
    {
      id: 3,
      title: 'Phase 3: Logistics (मतदान केंद्र)',
      description:
        phases.logistics ??
        'Locate your designated polling booth using the Voter Helpline (1950) or the Voter Portal. Carry your EPIC or any approved photo ID document on polling day.',
      isCompleted: false,
      isCurrent: false,
    },
    {
      id: 4,
      title: 'Phase 4: Execution (मतदान)',
      description:
        phases.execution ??
        'Cast your vote on Election Day using the Electronic Voting Machine (EVM) at your designated booth. Follow the Model Code of Conduct. VVPAT slip will be shown for 7 seconds.',
      isCompleted: false,
      isCurrent: false,
    },
  ];
}

/**
 * Maps an IndiaApiResponse to a synthetic CivicElection object so the
 * existing ElectionCard component can display it without modification.
 *
 * @param data - The IndiaApiResponse from the /api/india endpoint
 * @returns A CivicElection object
 */
export function mapIndiaToCivicElection(data: IndiaApiResponse): CivicElection {
  const { electionData } = data;
  const year = electionData.expectedElectionYear?.toString() ?? 'Upcoming';
  const electionType = electionData.electionType ?? 'General Election';
  const constituency = electionData.constituency ?? electionData.state ?? data.formattedAddress;

  return {
    id: 'india-gemini-fallback',
    name: `${electionType} — ${constituency}`,
    electionDay: `${year}-01-01`, // Approximate; exact date depends on ECI schedule
    ocdDivisionId: `ocd-division/country:in/state:${(electionData.state ?? 'india').toLowerCase().replace(/\s+/g, '_')}`,
  };
}

/**
 * Converts an IndiaApiResponse into a CivicVoterInfo-shaped object that the
 * existing ElectionPage.tsx renders without any changes.
 *
 * The polling location is synthesised from the geocoded address so the
 * Google Maps embed still works.
 *
 * @param data - The IndiaApiResponse from the /api/india endpoint
 * @returns A CivicVoterInfo object ready for the UI
 */
export function mapIndiaToCivicVoterInfo(data: IndiaApiResponse): CivicVoterInfo {
  const election = mapIndiaToCivicElection(data);

  // Create a synthetic polling location so PollingMap renders the city on the map
  const addressParts = data.formattedAddress.split(',').map((s) => s.trim());
  const pollingLocations = [
    {
      address: {
        locationName: addressParts[0] ?? data.formattedAddress,
        line1: addressParts[1] ?? '',
        city: addressParts[0] ?? '',
        state: data.electionData.state ?? addressParts[addressParts.length - 2] ?? '',
        zip: '',
      },
      pollingHours: 'As per ECI schedule (typically 7:00 AM – 6:00 PM)',
      ...(data.coordinates
        ? { latitude: data.coordinates.lat, longitude: data.coordinates.lng }
        : {}),
    },
  ];

  return {
    election,
    normalizedInput: {
      line1: data.formattedAddress,
    },
    pollingLocations,
    contests: [],
    mailOnly: false,
  };
}
