/**
 * LiveGuard — useLockedShell hook
 *
 * Measures visualViewport.height and locks the app-shell height to it.
 * Recalculates on:
 *   - phase change (entering a new screen)
 *   - orientationchange (deprecated but still fires on many browsers)
 *   - screen.orientation change (modern API, replaces orientationchange)
 *   - resize (fires after dimensions are updated)
 *   - visualViewport.resize (most reliable on mobile — URL bar, keyboard)
 *
 * When the device is in landscape, the rotate overlay is shown and the
 * locked height is cleared (the overlay is position:fixed and covers
 * the viewport regardless of shell height).
 *
 * Orientation detection: prefers window dimension comparison
 * (innerWidth > innerHeight) over screen.orientation.type because
 * dimensions always reflect the actual layout, while
 * screen.orientation.type can lag behind on some Android devices.
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Set to false to disable logs once the issue is confirmed fixed
const LOG_ORIENTATION = true;

function logOrientation(source: string): void {
  if (!LOG_ORIENTATION) return;
  const innerW = typeof window !== 'undefined' ? window.innerWidth : -1;
  const innerH = typeof window !== 'undefined' ? window.innerHeight : -1;
  const screenType = typeof window !== 'undefined' && window.screen?.orientation
    ? window.screen.orientation.type
    : '(unavailable)';
  const vvH = typeof window !== 'undefined' && window.visualViewport
    ? window.visualViewport.height
    : -1;
  const dimLandscape = innerW > innerH;
  console.info(
    `[useLockedShell] source=${source}`,
    `innerW=${innerW} innerH=${innerH}`,
    `dimLandscape=${dimLandscape}`,
    `screen.orientation.type=${screenType}`,
    `visualViewport.height=${vvH}`,
  );
}

function isLandscapeOrientation(): boolean {
  if (typeof window === 'undefined') return false;
  // Prefer dimension comparison — always reflects actual layout.
  // screen.orientation.type can lag behind on some Android devices,
  // causing the overlay to stay stuck when rotating back to portrait.
  return window.innerWidth > window.innerHeight;
}

function measureViewportHeight(): number {
  if (typeof window === 'undefined') return 0;
  if (window.visualViewport) {
    return window.visualViewport.height;
  }
  return window.innerHeight;
}

export function useLockedShell(phase: string) {
  const [lockedHeight, setLockedHeight] = useState<number | null>(null);
  const [showRotateOverlay, setShowRotateOverlay] = useState(false);
  const lastPhaseRef = useRef<string>('');
  const orientationDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lock = useCallback(() => {
    if (isLandscapeOrientation()) {
      setLockedHeight(null);
      return;
    }
    setLockedHeight(measureViewportHeight());
  }, []);

  const updateOrientation = useCallback((source: string = 'unknown') => {
    logOrientation(source);
    const isLandscape = isLandscapeOrientation();
    setShowRotateOverlay(isLandscape);
    if (isLandscape) {
      setLockedHeight(null);
    } else {
      setLockedHeight(measureViewportHeight());
    }
  }, []);

  // ─── Lock height on phase change ───────────────────────────────
  useEffect(() => {
    if (phase !== lastPhaseRef.current) {
      lastPhaseRef.current = phase;
      lock();
    }
  }, [phase, lock]);

  // ─── Initial orientation check at mount ────────────────────────
  useEffect(() => {
    updateOrientation('mount');
  }, [updateOrientation]);

  // ─── Listen to all orientation/resize events ───────────────────
  useEffect(() => {
    // orientationchange is deprecated but still fires on many browsers.
    // It fires BEFORE dimensions are updated on iOS Safari, so we both
    // call updateOrientation immediately (for Android where dimensions
    // may already be correct) AND debounce 200ms (for iOS Safari).
    const onOrientationChange = () => {
      // Immediate call — on Android, dimensions may already be updated
      updateOrientation('orientationchange:immediate');

      // Debounced call — for iOS Safari where dimensions lag
      if (orientationDebounceRef.current) {
        clearTimeout(orientationDebounceRef.current);
      }
      orientationDebounceRef.current = setTimeout(() => {
        updateOrientation('orientationchange:debounced');
      }, 200);
    };

    // resize fires AFTER dimensions are updated — reliable on all browsers
    const onResize = () => {
      updateOrientation('resize');
    };

    // screen.orientation change — modern API, replaces deprecated
    // orientationchange. More reliable on newer Android Chrome and
    // Capacitor webviews where orientationchange may not fire.
    const onScreenOrientationChange = () => {
      updateOrientation('screen.orientation.change');
    };

    window.addEventListener('orientationchange', onOrientationChange);
    window.addEventListener('resize', onResize);

    let vv: VisualViewport | null = null;
    if (window.visualViewport) {
      vv = window.visualViewport;
      vv.addEventListener('resize', onResize);
    }

    let screenOrientation: ScreenOrientation | null = null;
    if (window.screen?.orientation) {
      screenOrientation = window.screen.orientation;
      screenOrientation.addEventListener('change', onScreenOrientationChange);
    }

    return () => {
      window.removeEventListener('orientationchange', onOrientationChange);
      window.removeEventListener('resize', onResize);
      if (vv) {
        vv.removeEventListener('resize', onResize);
      }
      if (screenOrientation) {
        screenOrientation.removeEventListener('change', onScreenOrientationChange);
      }
      if (orientationDebounceRef.current) {
        clearTimeout(orientationDebounceRef.current);
      }
    };
  }, [updateOrientation]);

  return { lockedHeight, showRotateOverlay, lock };
}
