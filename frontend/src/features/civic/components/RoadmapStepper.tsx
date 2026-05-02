/**
 * RoadmapStepper.tsx
 *
 * A step-by-step voter roadmap component showing the key stages
 * from registering to vote through casting a ballot.
 *
 * Features:
 * - Multi-language translation via /api/translate (Google Cloud Translation API)
 * - "Decrypt Term" Gemini AI explainer via /api/explain
 * - Google Calendar deep-link integration
 *
 * This component is tested in RoadmapStepper.test.tsx.
 */
/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import type { RoadmapStep } from '../types';
import { useCalendarSync } from '../hooks/useCalendarSync';

/** Props for the RoadmapStepper component */
interface RoadmapStepperProps {
  /** Array of roadmap steps to display */
  steps: RoadmapStep[];
  /** Name of the election (used for calendar event titles) */
  electionName?: string;
  /**
   * The election date in ISO 8601 format (YYYY-MM-DD).
   * When provided, Phase 3 (Logistics) will show an "Add Election Day to
   * Google Calendar" button even if no step.deadline is set.
   */
  electionDate?: string;
}

/**
 * A single translation result from Google Cloud Translation API v2.
 */
interface TranslationResult {
  translatedText: string;
}

/**
 * The shape of the Cloud Translation API v2 response.
 */
interface TranslationApiResponse {
  data: {
    translations: TranslationResult[];
  };
}

/**
 * The shape of the /api/explain endpoint response.
 */
interface ExplainApiResponse {
  term: string;
  explanation: string;
}

/** Default voter roadmap steps used when civic data is available */
export const DEFAULT_ROADMAP_STEPS: RoadmapStep[] = [
  {
    id: 1,
    title: 'Phase 1: Authorization',
    description: 'Verify your voter registration is active and up to date.',
    isCompleted: false,
    isCurrent: true,
  },
  {
    id: 2,
    title: 'Phase 2: Intelligence',
    description: 'Research the candidates and ballot measures.',
    isCompleted: false,
    isCurrent: false,
  },
  {
    id: 3,
    title: 'Phase 3: Logistics',
    description: 'Confirm your polling place address and timeline.',
    isCompleted: false,
    isCurrent: false,
  },
  {
    id: 4,
    title: 'Phase 4: Execution',
    description: 'Cast your vote in person, by mail, or early voting.',
    isCompleted: false,
    isCurrent: false,
  },
];

/**
 * A civic term "Decrypt Term" panel powered by the Gemini AI.
 * Renders a button that, when clicked, fetches a plain-English ELI5
 * explanation of the given term from the /api/explain endpoint.
 *
 * @param term - The civic term to explain
 */
const DecryptTermButton: React.FC<{ term: string }> = ({ term }) => {
  const [explanation, setExplanation] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  /**
   * Fetches an ELI5 explanation from the /api/explain Gemini endpoint.
   * Sets local state with the result or an error indicator.
   */
  const handleDecrypt = async (): Promise<void> => {
    if (explanation || isLoading) return; // Prevent duplicate requests
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term }),
      });
      if (!res.ok) throw new Error('Explain API failed');
      const data = await res.json() as ExplainApiResponse;
      setExplanation(data.explanation);
    } catch (err) {
      console.error('[DecryptTerm] Error:', err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="decrypt-term" data-testid="decrypt-term-container">
      <button
        className="btn btn-ghost btn-sm decrypt-term__btn"
        onClick={() => void handleDecrypt()}
        disabled={isLoading}
        aria-label={`Decrypt civic term: ${term}. Get a simple explanation powered by Gemini AI.`}
        aria-expanded={explanation !== null}
        aria-busy={isLoading}
        data-testid="decrypt-term-btn"
      >
        <span aria-hidden="true">🔍</span>{' '}
        {isLoading ? 'Decrypting...' : 'Decrypt Term'}
      </button>

      {explanation && (
        <div
          className="decrypt-term__result"
          role="status"
          aria-live="polite"
          aria-label={`Explanation for ${term}`}
          data-testid="decrypt-term-result"
        >
          <strong>🤖 Gemini says:</strong> {explanation}
        </div>
      )}

      {hasError && (
        <p
          className="decrypt-term__error"
          role="alert"
          data-testid="decrypt-term-error"
        >
          Could not load explanation. Please try again.
        </p>
      )}
    </div>
  );
};

/**
 * RoadmapStepper component renders an ordered list of voter steps.
 *
 * Each step shows:
 * - A numbered indicator (completed, current, or pending)
 * - Title and description
 * - A "Decrypt Term" button powered by Gemini AI (ELI5 explanation)
 * - Optional "Add Deadline to Calendar" button if a deadline date is set
 *
 * A language selector at the top enables instant translation via
 * the Google Cloud Translation API.
 *
 * @param steps - The array of RoadmapStep objects to render
 * @param electionName - Election name used in calendar event titles
 *
 * @example
 * <RoadmapStepper steps={DEFAULT_ROADMAP_STEPS} electionName="General Election 2024" />
 */
export const RoadmapStepper: React.FC<RoadmapStepperProps> = ({
  steps,
  electionName = 'Election',
  electionDate,
}) => {
  const { openCalendarEvent } = useCalendarSync();
  const [lang, setLang] = React.useState('en');
  const [translatedSteps, setTranslatedSteps] = React.useState<RoadmapStep[]>(steps);
  const [isTranslating, setIsTranslating] = React.useState(false);

  /**
   * Effect: whenever the selected language changes, fetch translations
   * from the /api/translate proxy endpoint. Falls back to English on error.
   */
  React.useEffect(() => {
    if (lang === 'en') {
      setTranslatedSteps(steps);
      return;
    }

    const translateSteps = async (): Promise<void> => {
      setIsTranslating(true);
      try {
        const textsToTranslate = steps.flatMap((s) => [s.title, s.description]);

        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: textsToTranslate, target: lang }),
        });

        if (!res.ok) throw new Error('Translation failed');

        const data = await res.json() as TranslationApiResponse;
        const translations = data.data?.translations?.map((t) => t.translatedText);

        if (translations && translations.length === steps.length * 2) {
          const newSteps = steps.map((step, i) => ({
            ...step,
            title: translations[i * 2],
            description: translations[i * 2 + 1],
          }));
          setTranslatedSteps(newSteps);
        }
      } catch (err) {
        console.error('Translation error:', err);
        setTranslatedSteps(steps); // Fallback to English on error
      } finally {
        setIsTranslating(false);
      }
    };

    void translateSteps();
  }, [lang, steps]);

  return (
    <section
      className="roadmap"
      aria-label="Voter roadmap steps"
    >
      <header className="roadmap__header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="roadmap__heading">
            <span aria-hidden="true">🗺️</span> Your Voter Roadmap
          </h2>
          <p className="roadmap__subtitle">
            Follow these steps to make your vote count on Election Day.
          </p>
        </div>

        <div className="roadmap__language-selector" style={{ marginLeft: '1rem' }}>
          <label htmlFor="language-select" style={{ display: 'none' }}>Select Language</label>
          <select
            id="language-select"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="btn btn-outline btn-sm"
            aria-label="Select language for the voter roadmap"
            style={{ backgroundColor: '#0a0e1a', color: '#e2e8f0', borderColor: '#00d4ff', padding: '0.5rem', borderRadius: '4px' }}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="hi">हिन्दी</option>
          </select>
        </div>
      </header>

      {isTranslating && (
        <p
          className="roadmap__translating-text"
          role="status"
          aria-live="polite"
          style={{ fontStyle: 'italic', color: '#00d4ff' }}
        >
          Translating roadmap...
        </p>
      )}

      <ol
        className="roadmap__list"
        aria-label="Voter registration and voting steps"
        style={{ opacity: isTranslating ? 0.5 : 1, transition: 'opacity 0.2s ease-in-out' }}
      >
        {translatedSteps.map((step, index) => {
          const stepState = step.isCompleted
            ? 'completed'
            : step.isCurrent
            ? 'current'
            : 'pending';

          return (
            <li
              key={step.id}
              className={`roadmap__step roadmap__step--${stepState}`}
              aria-current={step.isCurrent ? 'step' : undefined}
              data-testid={`roadmap-step-${step.id}`}
            >
              {/* Step indicator */}
              <div
                className="roadmap__indicator"
                aria-label={
                  step.isCompleted
                    ? `Step ${index + 1} completed`
                    : step.isCurrent
                    ? `Step ${index + 1} in progress`
                    : `Step ${index + 1} pending`
                }
                aria-hidden="false"
              >
                {step.isCompleted ? (
                  <span aria-hidden="true">✓</span>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Connector line (decorative) */}
              {index < translatedSteps.length - 1 && (
                <div className="roadmap__connector" aria-hidden="true" />
              )}

              {/* Step content */}
              <div className="roadmap__content">
                <h3 className="roadmap__step-title">{step.title}</h3>
                <p className="roadmap__step-description">{step.description}</p>

                {/* Gemini AI Decrypt Term explainer */}
                <DecryptTermButton term={step.title} />

                {/* Phase 3 (Logistics) — always show an Election Day calendar button */}
                {step.id === 3 && electionDate && !step.deadline && (
                  <div className="roadmap__deadline" data-testid="phase3-calendar-container">
                    <button
                      className="btn btn-ghost btn-sm roadmap__calendar-btn"
                      onClick={() =>
                        openCalendarEvent({
                          title: `Election Day — ${electionName}`,
                          date: electionDate,
                          description: `Cast your vote for ${electionName}. Check your polling location before heading out.`,
                        })
                      }
                      aria-label={`Add Election Day for ${electionName} to Google Calendar`}
                      data-testid="phase3-calendar-btn"
                      tabIndex={0}
                    >
                      <span aria-hidden="true">📅</span> Add Election Day to Calendar
                    </button>
                  </div>
                )}

                {/* Deadline and calendar button (for steps with explicit deadlines) */}
                {step.deadline && (
                  <div className="roadmap__deadline">
                    <span className="roadmap__deadline-label">Deadline: </span>
                    <time
                      dateTime={step.deadline}
                      className="roadmap__deadline-date"
                    >
                      {step.deadline}
                    </time>
                    <button
                      className="btn btn-ghost btn-sm roadmap__calendar-btn"
                      onClick={() =>
                        openCalendarEvent({
                          title: `${step.title} — ${electionName}`,
                          date: step.deadline as string,
                          description: step.description,
                        })
                      }
                      aria-label={`Add "${step.title}" deadline to Google Calendar`}
                      tabIndex={0}
                    >
                      <span aria-hidden="true">📅</span> Add Reminder
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};
