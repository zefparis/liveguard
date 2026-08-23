/**
 * LiveGuard — Session Suspended Screen
 *
 * Shown when the behavioral beacon detects divergence and the session
 * is invalidated. Offers re-verification via the existing LiveGuard
 * cognitive test flow (prep → 5 tests → done).
 *
 * Includes a mini-terminal showing the real detection data from the
 * backend (divergence score, per-feature breakdown, network risk, etc.).
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { useState, useEffect, useRef } from 'react';
import { useI18n } from '../i18n/I18nContext';
import type { SuspensionData } from '../liveguard/behavior/telemetryTypes';

interface Props {
  reason: string;
  suspensionData: SuspensionData | null;
  onReverify: () => void;
  onBack: () => void;
}

// ─── Terminal line types ──────────────────────────────────────────────

interface TerminalLine {
  text: string;
  type: 'comment' | 'metric' | 'expected' | 'observed' | 'alert' | 'info';
}

function buildTerminalLines(data: SuspensionData | null, reason: string): TerminalLine[] {
  const lines: TerminalLine[] = [];
  const ts = data?.detectedAt ?? new Date().toISOString();

  lines.push({ text: `# signal_analysis.log — ${ts}`, type: 'comment' });
  lines.push({ text: `# reason: ${reason}`, type: 'comment' });
  lines.push({ text: '', type: 'comment' });

  if (reason === 'background_timeout' && data?.awayMs !== undefined) {
    // Scenario 1: blur/focus — no behavioral metrics, real timing data
    lines.push({ text: '> visibility_event:', type: 'metric' });
    lines.push({ text: `  tab_hidden_duration: ${data.awayMs}ms`, type: 'observed' });
    lines.push({ text: `  tolerance_threshold: ${data.toleranceMs ?? 3000}ms`, type: 'expected' });
    lines.push({ text: `  exceeded_by: ${data.awayMs - (data.toleranceMs ?? 3000)}ms`, type: 'alert' });
    lines.push({ text: '', type: 'comment' });
    lines.push({ text: '> session_state: INVALIDATED', type: 'alert' });
    lines.push({ text: '> trigger: background_timeout', type: 'info' });
  } else if (reason === 'mass_attempts_blocked' && data?.networkRiskScore !== undefined) {
    // Scenario 6: mass attempts — network risk score
    lines.push({ text: '> network_analysis:', type: 'metric' });
    lines.push({ text: `  risk_score: ${data.networkRiskScore} / 8`, type: 'observed' });
    lines.push({ text: `  threshold: 8`, type: 'expected' });
    lines.push({ text: `  status: ${data.networkRiskScore >= 8 ? 'BLOCKED' : 'EXCEEDED'}`, type: 'alert' });
    lines.push({ text: '', type: 'comment' });
    lines.push({ text: '> session_state: INVALIDATED', type: 'alert' });
    lines.push({ text: '> trigger: mass_attempts_blocked', type: 'info' });
  } else {
    // Behavioral scenarios (2,3,4,5) — divergence + feature breakdown
    const div = data?.divergence ?? 0;
    const breaches = data?.consecutiveBreaches ?? 0;

    lines.push({ text: '> behavioral_divergence:', type: 'metric' });
    lines.push({ text: `  ema_score: ${(div * 100).toFixed(1)}%`, type: div > 0.45 ? 'observed' : 'expected' });
    lines.push({ text: `  threshold: 45.0%`, type: 'expected' });
    lines.push({ text: `  consecutive_breaches: ${breaches} / 3`, type: breaches >= 3 ? 'alert' : 'observed' });
    lines.push({ text: '', type: 'comment' });

    if (data?.featureBreakdown && data.featureBreakdown.length > 0) {
      lines.push({ text: '> feature_breakdown:', type: 'metric' });
      for (const f of data.featureBreakdown) {
        const fType = f.divergence > 0.5 ? 'alert' : f.divergence > 0.2 ? 'observed' : 'expected';
        lines.push({
          text: `  ${f.name.padEnd(22)} ref=${f.reference ?? 'null'}  obs=${f.current ?? 'null'}  Δ=${(f.divergence * 100).toFixed(0)}%`,
          type: fType as TerminalLine['type'],
        });
      }
      lines.push({ text: '', type: 'comment' });
    }

    lines.push({ text: '> session_state: INVALIDATED', type: 'alert' });
    lines.push({ text: `> trigger: behavioral_divergence (EMA=${(div * 100).toFixed(1)}%)`, type: 'info' });
  }

  return lines;
}

// ─── MiniTerminal component ───────────────────────────────────────────

function MiniTerminal({ data, reason }: { data: SuspensionData | null; reason: string }) {
  const lines = buildTerminalLines(data, reason);
  const [visibleCount, setVisibleCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setVisibleCount(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setVisibleCount((c) => {
        if (c >= lines.length) {
          if (timerRef.current) clearInterval(timerRef.current);
          return c;
        }
        return c + 1;
      });
    }, 120);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [lines.length]);

  const colorClass = (type: TerminalLine['type']): string => {
    switch (type) {
      case 'comment': return 'term-comment';
      case 'metric': return 'term-metric';
      case 'expected': return 'term-expected';
      case 'observed': return 'term-observed';
      case 'alert': return 'term-alert';
      case 'info': return 'term-info';
    }
  };

  return (
    <div className="mini-terminal">
      <div className="mini-terminal-header">
        <span className="mini-terminal-dot mini-terminal-dot-red" />
        <span className="mini-terminal-dot mini-terminal-dot-yellow" />
        <span className="mini-terminal-dot mini-terminal-dot-green" />
        <span className="mini-terminal-label">signal_analysis.log</span>
      </div>
      <div className="mini-terminal-body">
        {lines.slice(0, visibleCount).map((line, i) => (
          <div key={i} className={`mini-terminal-line ${colorClass(line.type)}`}>
            {line.text || '\u00a0'}
          </div>
        ))}
        {visibleCount >= lines.length && (
          <div className="mini-terminal-line mini-terminal-cursor">&nbsp;</div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────

export function SessionSuspendedScreen({ reason, suspensionData, onReverify, onBack }: Props) {
  const { t } = useI18n();

  const message =
    reason === 'background_timeout'
      ? t('demo.suspendedBlurFocus')
      : reason === 'mass_attempts_blocked'
        ? t('demo.suspendedMassAttempts')
        : t('demo.suspendedBehavioral');

  return (
    <div className="screen-scroll">
      <div style={{ fontSize: 48 }}>🔒</div>
      <h1>{t('demo.sessionSuspended')}</h1>
      <p className="muted" style={{ maxWidth: 320, textAlign: 'center', lineHeight: 1.5 }}>
        {message}
      </p>

      <MiniTerminal data={suspensionData} reason={reason} />

      <button
        type="button"
        className="btn"
        onClick={onReverify}
        style={{ marginTop: 24, width: '80%' }}
      >
        {t('demo.reverifyButton')}
      </button>
      <button
        type="button"
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: '#60a5fa',
          fontSize: '13px',
          marginTop: '12px',
          cursor: 'pointer',
        }}
      >
        ← {t('demo.backToScenarios')}
      </button>
    </div>
  );
}
