/**
 * LiveGuard — Session Suspended Screen (DESKTOP version)
 *
 * Desktop-native 2-column layout: message + CTA on the left, terminal
 * log on the right. Uses the LiveGuard shield logo instead of the 🔒
 * emoji, and the indigo gradient CTA style established on the landing
 * page.
 *
 * Reuses buildTerminalLines + getSuspendedMessageKey from
 * sessionSuspendedShared.ts — no business logic duplication.
 *
 * Routed via useDesktop() in App.tsx. Mobile uses
 * SessionSuspendedScreen.tsx (never modified by this variant).
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { useState, useEffect, useRef } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { useTheme } from '../hooks/useTheme';
import { LiveGuardLogo } from '../components/LiveGuardLogo';
import { buildTerminalLines, getSuspendedMessageKey, type TerminalLine } from './sessionSuspendedShared';
import type { SuspensionData } from '../liveguard/behavior/telemetryTypes';
import '../styles/suspended-desktop.css';

interface Props {
  reason: string;
  suspensionData: SuspensionData | null;
  onReverify: () => void;
  onBack: () => void;
}

// ─── Desktop terminal with typing animation ───────────────────────────

function DesktopTerminal({ data, reason }: { data: SuspensionData | null; reason: string }) {
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
    }, 100);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [lines.length]);

  const lineClass = (type: TerminalLine['type']): string => {
    switch (type) {
      case 'comment': return 'ss-term-comment';
      case 'metric': return 'ss-term-metric';
      case 'expected': return 'ss-term-expected';
      case 'observed': return 'ss-term-observed';
      case 'alert': return 'ss-term-alert';
      case 'info': return 'ss-term-info';
    }
  };

  return (
    <div className="ss-terminal">
      <div className="ss-terminal-header">
        <span className="ss-terminal-dot ss-terminal-dot-red" />
        <span className="ss-terminal-dot ss-terminal-dot-yellow" />
        <span className="ss-terminal-dot ss-terminal-dot-green" />
        <span className="ss-terminal-label">signal_analysis.log</span>
      </div>
      <div className="ss-terminal-body">
        {lines.slice(0, visibleCount).map((line, i) => (
          <div key={i} className={`ss-terminal-line ${lineClass(line.type)}`}>
            {line.text || '\u00a0'}
          </div>
        ))}
        {visibleCount >= lines.length && (
          <div className="ss-terminal-line ss-terminal-cursor">&nbsp;</div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────

export function SessionSuspendedScreenDesktop({ reason, suspensionData, onReverify, onBack }: Props) {
  const { t } = useI18n();
  const { theme } = useTheme();
  const message = t(getSuspendedMessageKey(reason));

  return (
    <div className="ss-page" data-theme={theme}>
      <div className="ss-container">
        {/* Left column — message + CTA */}
        <div className="ss-message-col">
          <div className="ss-shield-badge">
            <LiveGuardLogo size={48} />
          </div>
          <h1 className="ss-title">{t('demo.sessionSuspended')}</h1>
          <p className="ss-description">{message}</p>

          <button type="button" className="ss-btn-reverify" onClick={onReverify}>
            <span>{t('demo.reverifyButton')}</span>
            <span aria-hidden="true">→</span>
          </button>

          <button type="button" className="ss-back" onClick={onBack}>
            <span aria-hidden="true">←</span>
            <span>{t('demo.backToScenarios')}</span>
          </button>
        </div>

        {/* Right column — terminal log */}
        <div className="ss-terminal-col">
          <DesktopTerminal data={suspensionData} reason={reason} />
        </div>
      </div>
    </div>
  );
}
