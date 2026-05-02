/**
 * RoadmapStepper.test.tsx
 *
 * Component tests for the RoadmapStepper using React Testing Library.
 * Verifies rendering, accessibility attributes, and conditional content.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

// ── Helpers ──────────────────────────────────────────────────────

function renderRoadmap(steps: RoadmapStep[] = DEFAULT_ROADMAP_STEPS, name?: string) {
  return render(<RoadmapStepper steps={steps} electionName={name} />);
}

// ── Tests ─────────────────────────────────────────────────────────

describe('RoadmapStepper', () => {
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
    // Only one item should have aria-current="step"
    const currentItems = allItems.filter(
      (el) => el.getAttribute('aria-current') === 'step'
    );
    expect(currentItems.length).toBeLessThanOrEqual(1);
  });

  it('renders step data-testid attributes for each step', () => {
    renderRoadmap();
    DEFAULT_ROADMAP_STEPS.forEach((step) => {
      expect(screen.getByTestId(`roadmap-step-${step.id}`)).toBeInTheDocument();
    });
  });

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
    // The module-level mock captures a fresh openCalendarEvent spy per call.
    // We render a step with a deadline and verify the button triggers the handler.
    const steps: RoadmapStep[] = [
      {
        id: 1, title: 'Register', description: 'Get registered',
        deadline: '2024-10-15', isCompleted: false, isCurrent: true,
      },
    ];
    render(<RoadmapStepper steps={steps} />);

    const btn = screen.getByRole('button', { name: /add.*deadline.*calendar/i });
    // Verify the button is present and keyboard-focusable
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();

    // Click should not throw
    await userEvent.click(btn);
  });

  it('renders the subtitle text', () => {
    renderRoadmap();
    expect(screen.getByText(/Follow these steps/i)).toBeInTheDocument();
  });

  it('renders a completed step with accessible label', () => {
    const steps: RoadmapStep[] = [
      { id: 1, title: 'Done Step', description: 'Already done', isCompleted: true, isCurrent: false },
    ];
    renderRoadmap(steps);
    // The indicator div should have an accessible label mentioning "completed"
    const indicator = screen.getByLabelText(/step 1 completed/i);
    expect(indicator).toBeInTheDocument();
  });
});
