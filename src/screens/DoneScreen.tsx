/**
 * LiveGuard — DoneScreen (redesigned)
 *
 * Warm, reassuring completion screen after the 5 cognitive tests.
 * Green check, 3 indicator tiles, primary CTA, expandable detail accordion.
 * "Probabilité humaine" is intentionally hidden (not yet wired to a real
 * computation — showing an empty dash would be worse than showing nothing).
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { LiveGuardLogo } from '../components/LiveGuardLogo';
import type { LiveGuardSafeResponse } from '../liveguard/types';
import type { CognitiveSignals } from '../liveguard/cognitive/cognitiveTypes';

interface Props {
  response: LiveGuardSafeResponse | null;
  cognitiveSignals: CognitiveSignals | null;
  startedAt: string | null;
  completedAt: string | null;
  onReset: () => void;
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12 L10 17 L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PuzzleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden width="22" height="22">
      <path d="M10.2 4.8a2.2 2.2 0 0 1 4.4 0v.8h2.6A1.8 1.8 0 0 1 19 7.4V10h.8a2.2 2.2 0 0 1 0 4.4H19v2.6a1.8 1.8 0 0 1-1.8 1.8h-2.6v-.8a2.2 2.2 0 0 0-4.4 0v.8H7.6A1.8 1.8 0 0 1 5.8 17v-2.6H5a2.2 2.2 0 0 1 0-4.4h.8V7.4A1.8 1.8 0 0 1 7.6 5.6h2.6v-.8Z"
            stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" transform="translate(-1.2 -1.2) scale(1.05)"/>
    </svg>
  );
}

function ShieldCheckIcon() {
  return <LiveGuardLogo size={22} />;
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden width="22" height="22">
      <rect x="4.5" y="10" width="15" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <circle cx="12" cy="14.5" r="1.4" fill="currentColor"/>
      <path d="M12 15.9v1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export function DoneScreen({ response, cognitiveSignals, startedAt, completedAt, onReset }: Props) {
  const { t } = useI18n();
  const [detailOpen, setDetailOpen] = useState(false);

  const elapsedMs = startedAt && completedAt
    ? new Date(completedAt).getTime() - new Date(startedAt).getTime()
    : 0;

  const completedModules = cognitiveSignals
    ? [cognitiveSignals.reflex, cognitiveSignals.stroop, cognitiveSignals.digit_span, cognitiveSignals.n_back, cognitiveSignals.trail_tap]
        .filter((m) => m !== null).length
    : 0;

  const summary = cognitiveSignals?.summary;
  const qualityScore = response?.quality_score ?? summary?.depth_score ?? 0;

  return (
    <div className="screen screen-center">
      <div className="done-check">
        <CheckIcon />
      </div>

      <h1 className="title-lg">{t('done.newTitle')}</h1>
      <p className="subtitle" style={{ marginTop: 8, marginBottom: 28 }}>
        {t('done.newMessage')}
      </p>

      {/* ── 3 indicator tiles ── */}
      <div className="done-indicators">
        <div className="done-indicator">
          <PuzzleIcon />
          <span>{t('done.indExercises')}</span>
        </div>
        <div className="done-indicator">
          <ShieldCheckIcon />
          <span>{t('done.indProfile')}</span>
        </div>
        <div className="done-indicator">
          <LockIcon />
          <span>{t('done.indPrivate')}</span>
        </div>
      </div>

      {/* ── Primary CTA ── */}
      <button className="btn-primary" onClick={onReset}>
        {t('done.back')}
      </button>

      {/* ── Expandable detail ── */}
      <button
        className="done-detail-toggle"
        onClick={() => setDetailOpen(prev => !prev)}
        aria-expanded={detailOpen}
        aria-controls="done-detail-panel"
      >
        {detailOpen ? t('done.hideDetail') : t('done.showDetail')}
        <svg
          viewBox="0 0 24 24" fill="none" width="14" height="14"
          style={{ transform: detailOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div
        id="done-detail-panel"
        className="done-detail-panel"
        hidden={!detailOpen}
      >
        <div className="card" style={{ width: '100%', maxWidth: 320 }}>
          <div className="done-stat">
            <span className="done-stat-label">{t('done.elapsedTime')}</span>
            <span className="done-stat-value">{formatDuration(elapsedMs)}</span>
          </div>
          <div className="done-stat">
            <span className="done-stat-label">{t('done.modulesCompleted')}</span>
            <span className="done-stat-value">{completedModules} / 5</span>
          </div>
          <div className="done-stat" style={{ borderBottom: 'none' }}>
            <span className="done-stat-label">{t('done.qualityScore')}</span>
            <span className="done-stat-value">{Math.round(qualityScore * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
