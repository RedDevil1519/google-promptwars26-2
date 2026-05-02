/**
 * RoadmapStepper.tsx
 *
 * A step-by-step voter roadmap component showing the key stages
 * from registering to vote through casting a ballot.
 *
 * This component is tested in RoadmapStepper.test.tsx.
 */
/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import type { RoadmapStep } from '../types';
import { useCalendarSync } from '../hooks/useCalendarSync';

interface RoadmapStepperProps {
  /** Array of roadmap steps to display */
  steps: RoadmapStep[];
  /** Name of the election (used for calendar event titles) */
  electionName?: string;
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
 * RoadmapStepper component renders an ordered list of voter steps.
 *
 * Each step shows:
 * - A numbered indicator (completed, current, or pending)
 * - Title and description
 * - Optional "Add Deadline to Calendar" button if a deadline date is set
 *
 * @example
 * <RoadmapStepper steps={DEFAULT_ROADMAP_STEPS} electionName="General Election 2024" />
 */
export const RoadmapStepper: React.FC<RoadmapStepperProps> = ({
  steps,
  electionName = 'Election',
}) => {
  const { openCalendarEvent } = useCalendarSync();
  const [lang, setLang] = React.useState('en');
  const [translatedSteps, setTranslatedSteps] = React.useState<RoadmapStep[]>(steps);
  const [isTranslating, setIsTranslating] = React.useState(false);

  React.useEffect(() => {
    if (lang === 'en') {
      setTranslatedSteps(steps);
      return;
    }

    const translateSteps = async () => {
      setIsTranslating(true);
      try {
        const textsToTranslate = steps.flatMap((s) => [s.title, s.description]);
        
        // Use our new backend proxy
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: textsToTranslate, target: lang }),
        });
        
        if (!res.ok) throw new Error('Translation failed');
        
        const data = await res.json();
        // The API returns an array of translations in the data.data.translations array
        const translations = data.data?.translations?.map((t: any) => t.translatedText);
        
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
          <label htmlFor="language-select" className="visually-hidden" style={{ display: 'none' }}>Select Language</label>
          <select 
            id="language-select"
            value={lang} 
            onChange={(e) => setLang(e.target.value)}
            className="btn btn-outline btn-sm"
            aria-label="Select language for roadmap"
            style={{ backgroundColor: '#0a0e1a', color: '#e2e8f0', borderColor: '#00d4ff', padding: '0.5rem', borderRadius: '4px' }}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="hi">हिन्दी</option>
          </select>
        </div>
      </header>

      {isTranslating && <p className="roadmap__translating-text" style={{ fontStyle: 'italic', color: '#00d4ff' }}>Translating roadmap...</p>}

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

                {/* Deadline and calendar button */}
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
