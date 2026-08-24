/**
 * CognitiveTestDesktopWrapper — desktop layout wrapper for cognitive tests.
 *
 * Wraps the ORIGINAL mobile test screen components (ReflexScreen,
 * StroopScreen, DigitSpanScreen, NBackScreen, TrailTapScreen) inside a
 * desktop-styled container. The mobile components run byte-for-byte
 * identically — same timing, same scoring, same state, same callbacks.
 * Only the CSS layout is overridden via cognitive-desktop.css, scoped
 * under .ctd-wrapper so mobile is never affected.
 *
 * This is the safest approach for calibration-critical screens: zero
 * logic duplication, zero mobile modifications, pure CSS layout layer.
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import type { ReactNode } from 'react';
import { useTheme } from '../hooks/useTheme';
import '../styles/cognitive-desktop.css';

interface Props {
  children: ReactNode;
}

export function CognitiveTestDesktopWrapper({ children }: Props) {
  const { theme } = useTheme();
  return (
    <div className="ctd-wrapper" data-theme={theme}>
      {children}
    </div>
  );
}
