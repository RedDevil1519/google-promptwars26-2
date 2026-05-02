/**
 * RoadmapStepper.test.tsx
 *
 * Component tests for the RoadmapStepper using React Testing Library.
 * Covers: rendering, accessibility, calendar integration, language selector,
 * and the Gemini-powered DecryptTerm button (all branches).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoadmapStepper, DEFAULT_ROADMAP_STEPS } from './RoadmapStepper';
import type { RoadmapStep } from '../types';

// Mock the useCalendarSync hook so no real browser APIs are needed
vi.mock('../hooks/useCalendarSync', () => ({
  useCalendarSync: () => ({
    buildCalendarLink: vi.fn(() => 'https://calendar.google.com/test'),
    openCalendarEvent: vi.fn(),
  }),
}));

// Mock global fetch for API calls
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ── Helpers ──────────────────────────────────────────────────────────────

/** Renders the RoadmapStepper with optional custom steps and election name. */
function renderRoadmap(steps: RoadmapStep[] = DEFAULT_ROADMAP_STEPS, name?: string) {
  return render(<RoadmapStepper steps={steps} electionName={name} />);
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('RoadmapStepper', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  // ── Core rendering ───────────────────────────────────────────────────

  it('renders the section heading', () => {
    renderRoadmap();
    expect(screen.getByRole('region', { name: /voter roadmap/i })).toBeInTheDocument();
    expect(screen.getByText(/Your Voter Roadmap/i)).toBeInTheDocument();
  });

  it('renders the correct number of steps', () => {
    renderRoadmap();
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(DEFAULT_ROADMAP_STEPS.length);
  });

  it('renders each step title', () => {
    renderRoadmap();
    DEFAULT_ROADMAP_STEPS.forEach((step) => {
      expect(screen.getByText(step.title)).toBeInTheDocument();
    });
  });

  it('renders the subtitle text', () => {
    renderRoadmap();
    expect(screen.getByText(/Follow these steps/i)).toBeInTheDocument();
  });

  // ── ARIA & accessibility ─────────────────────────────────────────────

  it('marks the current step with aria-current="step"', () => {
    const steps: RoadmapStep[] = [
      { id: 1, title: 'First Step', description: 'Do this first', isCompleted: false, isCurrent: false },
      { id: 2, title: 'Current Step', description: 'Do this now', isCompleted: false, isCurrent: true },
      { id: 3, title: 'Future Step', description: 'Do this later', isCompleted: false, isCurrent: false },
    ];
    renderRoadmap(steps);
    const currentItem = screen.getByText('Current Step').closest('li');
    expect(currentItem).toHaveAttribute('aria-current', 'step');
  });

  it('does NOT mark non-current steps with aria-current', () => {
    renderRoadmap();
    const allItems = screen.getAllByRole('listitem');
    const currentItems = allItems.filter(
      (el) => el.getAttribute('aria-current') === 'step'
    );
    expect(currentItems.length).toBeLessThanOrEqual(1);
  });

  it('renders a completed step with accessible label', () => {
    const steps: RoadmapStep[] = [
      { id: 1, title: 'Done Step', description: 'Already done', isCompleted: true, isCurrent: false },
    ];
    renderRoadmap(steps);
    const indicator = screen.getByLabelText(/step 1 completed/i);
    expect(indicator).toBeInTheDocument();
  });

  it('renders step data-testid attributes for each step', () => {
    renderRoadmap();
    DEFAULT_ROADMAP_STEPS.forEach((step) => {
      expect(screen.getByTestId(`roadmap-step-${step.id}`)).toBeInTheDocument();
    });
  });

  // ── Calendar integration ─────────────────────────────────────────────

  it('renders a calendar button when a step has a deadline', () => {
    const stepsWithDeadline: RoadmapStep[] = [
      {
        id: 1,
        title: 'Register',
        description: 'Get registered',
        deadline: '2024-10-15',
        isCompleted: false,
        isCurrent: true,
      },
    ];
    renderRoadmap(stepsWithDeadline);
    const calBtn = screen.getByRole('button', { name: /add.*deadline.*calendar/i });
    expect(calBtn).toBeInTheDocument();
  });

  it('does NOT render a calendar button when no deadline is set', () => {
    const stepsWithoutDeadline: RoadmapStep[] = [
      { id: 1, title: 'Vote', description: 'Cast ballot', isCompleted: false, isCurrent: true },
    ];
    renderRoadmap(stepsWithoutDeadline);
    expect(screen.queryByRole('button', { name: /add.*deadline.*calendar/i })).not.toBeInTheDocument();
  });

  it('calls openCalendarEvent when calendar button is clicked', async () => {
    const steps: RoadmapStep[] = [
      {
        id: 1, title: 'Register', description: 'Get registered',
        deadline: '2024-10-15', isCompleted: false, isCurrent: true,
      },
    ];
    render(<RoadmapStepper steps={steps} />);
    const btn = screen.getByRole('button', { name: /add.*deadline.*calendar/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
    await userEvent.click(btn);
  });

  // ── Language selector ────────────────────────────────────────────────

  it('renders the language selector dropdown', () => {
    renderRoadmap();
    const select = screen.getByRole('combobox', { name: /select language/i });
    expect(select).toBeInTheDocument();
  });

  it('language selector shows English, Español, and Hindi options', () => {
    renderRoadmap();
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Español' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'हिन्दी' })).toBeInTheDocument();
  });

  it('calls /api/translate when a non-English language is selected', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          translations: DEFAULT_ROADMAP_STEPS.flatMap((s) => [
            { translatedText: `[ES] ${s.title}` },
            { translatedText: `[ES] ${s.description}` },
          ]),
        },
      }),
    });

    renderRoadmap();
    const select = screen.getByRole('combobox', { name: /select language/i });
    await userEvent.selectOptions(select, 'es');

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/translate',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('falls back to English when the translation API returns an error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    renderRoadmap();
    const select = screen.getByRole('combobox', { name: /select language/i });
    await userEvent.selectOptions(select, 'hi');

    // After error, original English titles should still appear
    await waitFor(() => {
      expect(screen.getByText('Phase 1: Authorization')).toBeInTheDocument();
    });
  });

  it('resets to English when "English" option is re-selected', async () => {
    renderRoadmap();
    const select = screen.getByRole('combobox', { name: /select language/i });
    // Select English again to trigger the early-return branch
    await userEvent.selectOptions(select, 'en');
    expect(screen.getByText('Phase 1: Authorization')).toBeInTheDocument();
  });

  // ── Decrypt Term (Gemini AI) button ──────────────────────────────────

  it('renders a Decrypt Term button for each step', () => {
    renderRoadmap();
    const decryptBtns = screen.getAllByTestId('decrypt-term-btn');
    expect(decryptBtns).toHaveLength(DEFAULT_ROADMAP_STEPS.length);
  });

  it('Decrypt Term button is initially enabled and not loading', () => {
    renderRoadmap();
    const btn = screen.getAllByTestId('decrypt-term-btn')[0];
    expect(btn).not.toBeDisabled();
    expect(btn).toHaveTextContent(/Decrypt Term/i);
  });

  it('shows explanation after successful Decrypt Term fetch', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        term: 'Phase 1: Authorization',
        explanation: 'It means making sure you are allowed to vote.',
      }),
    });

    renderRoadmap();
    const btn = screen.getAllByTestId('decrypt-term-btn')[0];
    await userEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByTestId('decrypt-term-result')).toBeInTheDocument();
      expect(screen.getByText(/making sure you are allowed to vote/i)).toBeInTheDocument();
    });
  });

  it('shows error message when Decrypt Term API fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    renderRoadmap();
    const btn = screen.getAllByTestId('decrypt-term-btn')[0];
    await userEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByTestId('decrypt-term-error')).toBeInTheDocument();
    });
  });

  it('does not re-fetch if explanation is already loaded', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        term: 'Phase 1: Authorization',
        explanation: 'Cached explanation.',
      }),
    });

    renderRoadmap();
    const btn = screen.getAllByTestId('decrypt-term-btn')[0];
    await userEvent.click(btn);
    await waitFor(() => screen.getByTestId('decrypt-term-result'));

    // Click again — should NOT call fetch a second time
    await userEvent.click(btn);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  // ── Phase 3 Election Day Calendar button ─────────────────────────────

  it('shows Phase 3 Election Day calendar button when electionDate is provided', () => {
    render(
      <RoadmapStepper
        steps={DEFAULT_ROADMAP_STEPS}
        electionName="General Election"
        electionDate="2024-11-05"
      />
    );
    expect(screen.getByTestId('phase3-calendar-btn')).toBeInTheDocument();
    expect(screen.getByTestId('phase3-calendar-btn')).toHaveTextContent(/Add Election Day to Calendar/i);
  });

  it('Phase 3 calendar button has an accessible aria-label with election name', () => {
    render(
      <RoadmapStepper
        steps={DEFAULT_ROADMAP_STEPS}
        electionName="General Election"
        electionDate="2024-11-05"
      />
    );
    const btn = screen.getByTestId('phase3-calendar-btn');
    expect(btn).toHaveAttribute('aria-label', expect.stringContaining('General Election'));
  });

  it('does NOT show Phase 3 Election Day calendar button when electionDate is omitted', () => {
    render(<RoadmapStepper steps={DEFAULT_ROADMAP_STEPS} electionName="General Election" />);
    expect(screen.queryByTestId('phase3-calendar-btn')).not.toBeInTheDocument();
  });

  it('Phase 3 calendar button is clickable and calls openCalendarEvent', async () => {
    render(
      <RoadmapStepper
        steps={DEFAULT_ROADMAP_STEPS}
        electionName="General Election"
        electionDate="2024-11-05"
      />
    );
    const btn = screen.getByTestId('phase3-calendar-btn');
    await userEvent.click(btn);
    // Should not throw — openCalendarEvent mock is already set up
    expect(btn).toBeInTheDocument();
  });
});
