/**
 * ErrorBoundary.tsx
 *
 * A React class component error boundary that catches rendering errors
 * and displays a fallback UI instead of crashing the entire page.
 */
import React, { Component, type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  /** Content to render when no error has occurred */
  children: React.ReactNode;
  /** Optional custom fallback UI */
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Wraps children in an error boundary.
 * When a descendant component throws during rendering,
 * this boundary catches it and renders a user-friendly error panel.
 *
 * @example
 * <ErrorBoundary>
 *   <SomeFlakeyComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="error-boundary"
        >
          <div className="error-boundary__icon" aria-hidden="true">⚠️</div>
          <h2 className="error-boundary__title">Something went wrong</h2>
          <p className="error-boundary__message">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            className="btn btn-secondary btn-md"
            onClick={this.handleReset}
            aria-label="Try again"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
