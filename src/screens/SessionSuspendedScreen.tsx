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
import { buildTerminalLines, getSuspendedMessageKey, type TerminalLine } from './sessionSuspendedShared';

interface Props {
  reason: string;
  suspensionData: SuspensionData | null;
  onReverify: () => void;
  onBack: () => void;
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

  const message = t(getSuspendedMessageKey(reason));

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
