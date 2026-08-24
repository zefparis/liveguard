/**
 * LiveGuard — Session Suspended shared logic
 *
 * Extracted from SessionSuspendedScreen so both the mobile and desktop
 * variants can reuse the exact same terminal-line builder without
 * duplicating business logic.
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import type { SuspensionData } from '../liveguard/behavior/telemetryTypes';

export interface TerminalLine {
  text: string;
  type: 'comment' | 'metric' | 'expected' | 'observed' | 'alert' | 'info';
}

export function buildTerminalLines(data: SuspensionData | null, reason: string): TerminalLine[] {
  const lines: TerminalLine[] = [];
  const ts = data?.detectedAt ?? new Date().toISOString();

  lines.push({ text: `# signal_analysis.log — ${ts}`, type: 'comment' });
  lines.push({ text: `# reason: ${reason}`, type: 'comment' });
  lines.push({ text: '', type: 'comment' });

  if (reason === 'background_timeout' && data?.awayMs !== undefined) {
    // SECURITY: Do not expose the real tolerance threshold value.
    // Display only the fact that the threshold was exceeded, not the exact ms.
    lines.push({ text: '> visibility_event:', type: 'metric' });
    lines.push({ text: `  tab_hidden_duration: ${data.awayMs}ms`, type: 'observed' });
    lines.push({ text: '  tolerance_threshold: [redacted]', type: 'expected' });
    lines.push({ text: '  status: EXCEEDED', type: 'alert' });
    lines.push({ text: '', type: 'comment' });
    lines.push({ text: '> session_state: INVALIDATED', type: 'alert' });
    lines.push({ text: '> trigger: background_timeout', type: 'info' });
  } else if (reason === 'mass_attempts_blocked' && data?.networkRiskScore !== undefined) {
    // SECURITY: Do not expose the real risk threshold value.
    // Display only the fact that the threshold was exceeded, not the exact score.
    lines.push({ text: '> network_analysis:', type: 'metric' });
    lines.push({ text: '  risk_score: [redacted]', type: 'observed' });
    lines.push({ text: '  threshold: [redacted]', type: 'expected' });
    lines.push({ text: '  status: EXCEEDED', type: 'alert' });
    lines.push({ text: '', type: 'comment' });
    lines.push({ text: '> session_state: INVALIDATED', type: 'alert' });
    lines.push({ text: '> trigger: mass_attempts_blocked', type: 'info' });
  } else {
    const breaches = data?.consecutiveBreaches ?? 0;

    // SECURITY: Do not expose the real EMA threshold or exact divergence score.
    // Display only the fact that the threshold was exceeded and the breach count.
    lines.push({ text: '> behavioral_divergence:', type: 'metric' });
    lines.push({ text: '  ema_score: [redacted]', type: 'observed' });
    lines.push({ text: '  threshold: [redacted]', type: 'expected' });
    lines.push({ text: `  consecutive_breaches: ${breaches} / [redacted]`, type: breaches >= 3 ? 'alert' : 'observed' });
    lines.push({ text: '', type: 'comment' });

    if (data?.featureBreakdown && data.featureBreakdown.length > 0) {
      lines.push({ text: '> feature_breakdown:', type: 'metric' });
      for (const f of data.featureBreakdown) {
        const fType = f.divergence > 0.5 ? 'alert' : f.divergence > 0.2 ? 'observed' : 'expected';
        lines.push({
          text: `  ${f.name.padEnd(22)} Δ=${(f.divergence * 100).toFixed(0)}%`,
          type: fType as TerminalLine['type'],
        });
      }
      lines.push({ text: '', type: 'comment' });
    }

    lines.push({ text: '> session_state: INVALIDATED', type: 'alert' });
    lines.push({ text: '> trigger: behavioral_divergence', type: 'info' });
  }

  return lines;
}

export function getSuspendedMessageKey(reason: string): string {
  if (reason === 'background_timeout') return 'demo.suspendedBlurFocus';
  if (reason === 'mass_attempts_blocked') return 'demo.suspendedMassAttempts';
  return 'demo.suspendedBehavioral';
}
