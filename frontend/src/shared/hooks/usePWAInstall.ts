/**
 * usePWAInstall.ts
 *
 * Custom hook that manages the Progressive Web App installation prompt.
 *
 * The browser fires a `beforeinstallprompt` event when the app is installable.
 * This hook captures that event so the app can show a custom "Install App"
 * button at the right time rather than relying on the browser's default UI.
 *
 * @returns Object containing:
 *   - `isInstallable` — true when the browser is ready to install
 *   - `promptInstall` — call this to trigger the native install prompt
 *   - `isInstalled` — true after the user successfully installs
 */
import { useState, useEffect, useCallback } from 'react';

/**
 * The shape of the browser's `beforeinstallprompt` event.
 * This is not in the standard TypeScript lib, so we declare it here.
 */
interface BeforeInstallPromptEvent extends Event {
  /** Prompts the user to install the app. Returns a promise. */
  prompt(): Promise<void>;
  /** The user's choice — 'accepted' or 'dismissed'. */
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Return type of the usePWAInstall hook */
interface UsePWAInstallResult {
  /** True when the browser has signalled the app can be installed */
  isInstallable: boolean;
  /** Triggers the native browser install prompt */
  promptInstall: () => Promise<void>;
  /** True after the user accepted the install prompt */
  isInstalled: boolean;
}

/**
 * Hook for managing the PWA install lifecycle.
 *
 * @example
 * const { isInstallable, promptInstall } = usePWAInstall();
 * if (isInstallable) {
 *   return <button onClick={promptInstall}>Install App</button>;
 * }
 */
export function usePWAInstall(): UsePWAInstallResult {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    /**
     * The browser fires `beforeinstallprompt` when the PWA criteria are met.
     * We capture and defer it so we can show our own button.
     */
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault(); // Suppress the browser's default mini-infobar
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    /**
     * The browser fires `appinstalled` after the user completes installation.
     */
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  /**
   * Triggers the deferred native browser install prompt.
   * No-op if the prompt is not available.
   */
  const promptInstall = useCallback(async (): Promise<void> => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setIsInstallable(false);
  }, [deferredPrompt]);

  return { isInstallable, promptInstall, isInstalled };
}
