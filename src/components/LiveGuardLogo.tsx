/**
 * LiveGuardLogo — brand shield with ECG pulse trace.
 *
 * Stroke-only shield outline (viewBox 100x100) with a pulse line crossing
 * the middle. Gradient stroke switches between dark and light variants
 * based on the app theme (useTheme).
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { useId } from 'react';
import { useTheme } from '../hooks/useTheme';

interface Props {
  size?: number;
  className?: string;
}

export function LiveGuardLogo({ size = 38, className }: Props) {
  const { theme } = useTheme();
  const gradientId = useId();

  const stops = theme === 'dark'
    ? { from: '#7f8ce0', to: '#5b4fe8' }
    : { from: '#5b4fe8', to: '#4038b0' };

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={stops.from} />
          <stop offset="100%" stopColor={stops.to} />
        </linearGradient>
      </defs>
      <path
        d="M50 6 L86 20 L86 48 C86 72 70 88 50 96 C30 88 14 72 14 48 L14 20 Z"
        stroke={`url(#${gradientId})`}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="M22 50 L38 50 L45 34 L54 64 L62 44 L68 50 L78 50"
        stroke={`url(#${gradientId})`}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
