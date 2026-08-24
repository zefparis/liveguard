/**
 * useDesktop — viewport width detection for desktop/mobile routing.
 *
 * Returns true when the viewport is wider than MOBILE_MAX_WIDTH (900px),
 * the same threshold used by useLockedShell and the CSS media queries.
 * Used by App.tsx to decide whether to mount LandingScreenDesktop
 * (a separate component with its own CSS) or the mobile LandingScreen.
 *
 * Listens to window resize and updates reactively. Returns false during
 * SSR / before mount to avoid layout flash (mobile renders first, then
 * desktop swaps in if the viewport is wide enough).
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { useState, useEffect } from 'react';

const MOBILE_MAX_WIDTH = 900;

export function useDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth > MOBILE_MAX_WIDTH;
  });

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth > MOBILE_MAX_WIDTH);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isDesktop;
}
