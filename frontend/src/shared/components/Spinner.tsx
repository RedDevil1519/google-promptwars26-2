/**
 * Spinner.tsx
 *
 * An accessible loading spinner component.
 * Uses role="status" and aria-label to communicate loading state to screen readers.
 */
import React from 'react';

interface SpinnerProps {
  /** Size of the spinner in pixels (default: 40) */
  size?: number;
  /** Accessible label for screen readers */
  label?: string;
  /** Optional CSS class override */
  className?: string;
}

/**
 * Animated loading spinner with screen reader support.
 *
 * @example
 * <Spinner label="Loading election data..." size={32} />
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 40,
  label = 'Loading...',
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-label={label}
      className={`spinner ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        className="spinner-svg"
        viewBox="0 0 50 50"
        aria-hidden="true"
        focusable="false"
      >
        <circle
          className="spinner-track"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4"
        />
        <circle
          className="spinner-fill"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4"
          strokeDasharray="80 40"
        />
      </svg>
      {/* Visually hidden text for screen readers */}
      <span className="sr-only">{label}</span>
    </div>
  );
};
