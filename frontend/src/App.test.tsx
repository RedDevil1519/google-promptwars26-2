/**
 * App.test.tsx
 *
 * Integration tests for the root App component.
 * Verifies: initial render, Suspense loading fallback, and PWA install banner
 * visibility in both installable and non-installable states.
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

// ── Mock the PWA install hook ─────────────────────────────────────────────────

// Default: app is NOT installable (the common case at first load)
const mockUsePWAInstall = {
  isInstallable: false,
  isInstalled: false,
  promptInstall: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@shared/hooks/usePWAInstall', () => ({
  usePWAInstall: () => mockUsePWAInstall,
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('App Component', () => {
  beforeEach(() => {
    mockUsePWAInstall.isInstallable = false;
    mockUsePWAInstall.isInstalled = false;
  });

  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeInTheDocument();
  });

  it('renders the initial loading/initializing phase text', async () => {
    render(<App />);
    // The Suspense fallback should show "Initializing Voter Protocol Engine…"
    const initializingText = await screen.findByText(/Initializing Voter Protocol Engine/i);
    expect(initializingText).toBeInTheDocument();
  });

  it('does NOT show the PWA install banner when app is not installable', () => {
    mockUsePWAInstall.isInstallable = false;
    render(<App />);
    expect(screen.queryByRole('complementary', { name: /install voter protocol/i })).not.toBeInTheDocument();
  });

  it('shows the PWA install banner when browser signals app is installable', () => {
    mockUsePWAInstall.isInstallable = true;
    render(<App />);
    const banner = screen.getByRole('complementary', { name: /install voter protocol/i });
    expect(banner).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /install voter protocol engine/i });
    expect(btn).toBeInTheDocument();
  });

  it('hides the PWA install banner after the app is installed', () => {
    mockUsePWAInstall.isInstallable = true;
    mockUsePWAInstall.isInstalled = true;
    render(<App />);
    expect(screen.queryByRole('complementary', { name: /install voter protocol/i })).not.toBeInTheDocument();
  });
});
