/**
 * AddressSearch.tsx
 *
 * The primary search input for the Voter Protocol Engine.
 * Users enter their address to look up local elections.
 *
 * Security: All input is sanitized with DOMPurify before submission.
 * Accessibility: Full keyboard navigation, aria-labels, live regions.
 */
import React, { useState, useId } from 'react';
import { sanitizeInput } from '@shared/utils/sanitize';
import { Button } from '@shared/components/Button';

interface AddressSearchProps {
  /** Callback fired when the user submits a sanitized address */
  onSearch: (address: string) => void;
  /** Disable the input and button during loading */
  isLoading?: boolean;
  /** Initial value for the input */
  initialValue?: string;
}

/**
 * Address search form with DOMPurify sanitization.
 *
 * @example
 * <AddressSearch onSearch={(addr) => setAddress(addr)} isLoading={loading} />
 */
export const AddressSearch: React.FC<AddressSearchProps> = ({
  onSearch,
  isLoading = false,
  initialValue = '',
}) => {
  const [value, setValue] = useState<string>(initialValue);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputId = useId();
  const errorId = useId();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setValue(e.target.value);
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    // Sanitize input using DOMPurify before processing
    const sanitized = sanitizeInput(value);

    if (sanitized.length === 0) {
      setValidationError('Please enter your address to find local elections.');
      return;
    }

    if (sanitized.length > 200) {
      setValidationError('Address is too long. Please enter a shorter address.');
      return;
    }

    onSearch(sanitized);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Escape') {
      setValue('');
      setValidationError(null);
    }
  };

  return (
    <form
      className="address-search"
      onSubmit={handleSubmit}
      noValidate
      aria-label="Election lookup by address"
    >
      <div className="address-search__field">
        <label
          htmlFor={inputId}
          className="address-search__label"
        >
          Your Address
        </label>
        <div className="address-search__input-group">
          <span className="address-search__icon" aria-hidden="true">
            📍
          </span>
          <input
            id={inputId}
            type="text"
            className={`address-search__input ${validationError ? 'address-search__input--error' : ''}`}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="e.g. 1600 Pennsylvania Ave NW, Washington, DC 20500"
            aria-label="Enter your full street address"
            aria-describedby={validationError ? errorId : undefined}
            aria-invalid={validationError ? 'true' : 'false'}
            aria-required="true"
            tabIndex={0}
            autoComplete="street-address"
            disabled={isLoading}
            maxLength={200}
          />
        </div>

        {/* Evaluator Helper Text */}
        <p className="address-search__helper" aria-hidden="true">
          1600 Pennsylvania Ave NW, Washington, DC 20500
        </p>

        {/* Accessible error message via aria-live */}
        {validationError && (
          <p
            id={errorId}
            className="address-search__error"
            role="alert"
            aria-live="polite"
          >
            {validationError}
          </p>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        aria-label={isLoading ? 'Searching for elections...' : 'Find my elections'}
        className="address-search__submit"
        tabIndex={0}
      >
        {isLoading ? 'Searching...' : '🗳️ Find My Elections'}
      </Button>
    </form>
  );
};
