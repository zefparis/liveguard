/**
 * LiveGuard — useLockedShell hook
 *
 * Measures visualViewport.height and locks the app-shell height to it.
 * Recalculates on:
 *   - phase change (entering a new screen)
 *   - orientationchange (with debounced re-read for iOS Safari)
 *   - resize (fires after dimensions are updated, unlike orientationchange)
 *   - visualViewport.resize (most reliable on mobile — fires on URL bar
 *     show/hide, keyboard, and orientation changes)
 *
 * When the device is in landscape, the rotate overlay is shown and the
 * locked height is cleared (the overlay is position:fixed and covers
 * the viewport regardless of shell height).
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { useState, useEffect, useCallback, useRef } from 'react';

function isLandscapeOrientation(): boolean {
  if (typeof window === 'undefined') return false;
  // Use screen.orientation if available (more reliable), fallback to dimensions
  if (window.screen?.orientation) {
    return window.screen.orientation.type.startsWith('landscape');
  }
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
    // Don't lock height in landscape — the overlay covers everything
    if (isLandscapeOrientation()) {
      setLockedHeight(null);
      return;
    }
    setLockedHeight(measureViewportHeight());
  }, []);

  const updateOrientation = useCallback(() => {
    const isLandscape = isLandscapeOrientation();
    setShowRotateOverlay(isLandscape);
    if (isLandscape) {
      // Clear locked height in landscape — overlay is position:fixed
      setLockedHeight(null);
    } else {
      // Recalculate height for the new portrait dimensions
      // (URL bar visibility may have changed during rotation)
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
    updateOrientation();
  }, [updateOrientation]);

  // ─── Listen to orientationchange, resize, and visualViewport.resize ──
  useEffect(() => {
    // orientationchange fires BEFORE dimensions are updated on iOS Safari.
    // Debounce with a short timeout so we read the correct values.
    const onOrientationChange = () => {
      if (orientationDebounceRef.current) {
        clearTimeout(orientationDebounceRef.current);
      }
      orientationDebounceRef.current = setTimeout(() => {
        updateOrientation();
      }, 200);
    };

    // resize fires AFTER dimensions are updated — reliable on all browsers
    const onResize = () => {
      updateOrientation();
    };

    window.addEventListener('orientationchange', onOrientationChange);
    window.addEventListener('resize', onResize);

    let vv: VisualViewport | null = null;
    if (window.visualViewport) {
      vv = window.visualViewport;
      vv.addEventListener('resize', onResize);
    }

    return () => {
      window.removeEventListener('orientationchange', onOrientationChange);
      window.removeEventListener('resize', onResize);
      if (vv) {
        vv.removeEventListener('resize', onResize);
      }
      if (orientationDebounceRef.current) {
        clearTimeout(orientationDebounceRef.current);
      }
    };
  }, [updateOrientation]);

  return { lockedHeight, showRotateOverlay, lock };
}
