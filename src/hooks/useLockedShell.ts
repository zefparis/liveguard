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
 * When the device is in landscape AND is a mobile/touch device, the rotate
 * overlay is shown and the locked height is cleared (the overlay is
 * position:fixed and covers the viewport regardless of shell height).
 *
 * Desktop guard: the rotate overlay is ONLY shown on mobile/touch devices.
 * A desktop browser window (which typically has innerWidth > innerHeight)
 * must never trigger the overlay — otherwise the site would be completely
 * blocked for desktop visitors. Detection uses:
 *   - matchMedia('(pointer: coarse)') — primary pointer is touch
 *   - 'ontouchstart' in window || maxTouchPoints > 0 — touch API present
 *   - max-width 900px — viewport is narrow enough to be a phone/tablet
 * All three must be satisfied (coarse pointer + touch + narrow viewport)
 * to treat the device as mobile. This prevents:
 *   - Desktop with mouse (pointer: fine) → no overlay, even if window is wide
 *   - Desktop narrowed to 400px (split-screen) → no overlay (no touch)
 *   - Touch laptop with narrow window → no overlay (pointer: fine or
 *     maxTouchPoints but viewport > 900px in most cases)
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Set to false to disable logs once the issue is confirmed fixed
const LOG_ORIENTATION = true;

// Viewport width above which we assume desktop, regardless of touch.
// Phones max out at ~430px, tablets at ~1024px. 900px is a safe cutoff
// that covers phones in landscape (e.g. 812x375) while excluding
// desktop windows and tablets in landscape (which have enough height
// to not need the rotate overlay).
const MOBILE_MAX_WIDTH = 900;

function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  // pointer: coarse means the primary input is touch (no fine pointer
  // like a mouse). This is the most reliable CSS media query for this.
  const coarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches ?? false;
  // Fallback: explicit touch API presence (used elsewhere in this project:
  // behaviorSession.ts:35, touchCollector.ts:60)
  const hasTouchApi = 'ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0;
  return coarsePointer || hasTouchApi;
}

function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= MOBILE_MAX_WIDTH;
}

function isLandscapeOrientation(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > window.innerHeight;
}

/**
 * Returns true only if the device is a mobile/touch device in landscape.
 * Desktop browsers (even with innerWidth > innerHeight) never trigger
 * the overlay because they lack touch or have a wide viewport.
 */
function shouldShowRotateOverlay(): boolean {
  if (typeof window === 'undefined') return false;
  // Must be landscape AND mobile (touch + narrow viewport)
  return isLandscapeOrientation() && isTouchDevice() && isMobileViewport();
}

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
  const touch = isTouchDevice();
  const mobileVP = isMobileViewport();
  const shouldOverlay = shouldShowRotateOverlay();
  console.info(
    `[useLockedShell] source=${source}`,
    `innerW=${innerW} innerH=${innerH}`,
    `dimLandscape=${dimLandscape}`,
    `touch=${touch} mobileVP=${mobileVP}`,
    `shouldOverlay=${shouldOverlay}`,
    `screen.orientation.type=${screenType}`,
    `visualViewport.height=${vvH}`,
  );
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
    // Only clear height for mobile landscape (where overlay shows)
    if (shouldShowRotateOverlay()) {
      setLockedHeight(null);
      return;
    }
    setLockedHeight(measureViewportHeight());
  }, []);

  const updateOrientation = useCallback((source: string = 'unknown') => {
    logOrientation(source);
    const shouldOverlay = shouldShowRotateOverlay();
    setShowRotateOverlay(shouldOverlay);
    if (shouldOverlay) {
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
