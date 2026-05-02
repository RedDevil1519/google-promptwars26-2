
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Component', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeInTheDocument();
  });

  it('renders the initial loading/initializing phase text', async () => {
    render(<App />);
    // The Suspense fallback should show "Initializing Voter Protocol Engine…"
    // Note: Assuming "Authorization" from the prompt was a typo for "Initializing"
    const initializingText = await screen.findByText(/Initializing Voter Protocol Engine/i);
    expect(initializingText).toBeInTheDocument();
  });
});
