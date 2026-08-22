/**
 * LiveGuard — DoneScreen
 *
 * Green check, confirmation message, elapsed time, "Retour à l'application".
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { useI18n } from '../i18n/I18nContext';
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

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export function DoneScreen({ response, cognitiveSignals, startedAt, completedAt, onReset }: Props) {
  const { t } = useI18n();

  const elapsedMs = startedAt && completedAt
    ? new Date(completedAt).getTime() - new Date(startedAt).getTime()
    : 0;

  const completedModules = cognitiveSignals
    ? [cognitiveSignals.reflex, cognitiveSignals.stroop, cognitiveSignals.digit_span, cognitiveSignals.n_back, cognitiveSignals.trail_tap]
        .filter((m) => m !== null).length
    : 0;

  const summary = cognitiveSignals?.summary;
  const humanLikelihood = summary?.human_likelihood ?? '—';
  const qualityScore = response?.quality_score ?? summary?.depth_score ?? 0;

  return (
    <div className="screen screen-center">
      <div className="done-check">
        <CheckIcon />
      </div>

      <h1 className="title-lg">{t('done.title')}</h1>
      <p className="subtitle" style={{ marginTop: 8, marginBottom: 28 }}>
        {t('done.message')}
      </p>

      <div className="card" style={{ width: '100%', maxWidth: 320, marginBottom: 28 }}>
        <div className="done-stat">
          <span className="done-stat-label">{t('done.elapsedTime')}</span>
          <span className="done-stat-value">{formatDuration(elapsedMs)}</span>
        </div>
        <div className="done-stat">
          <span className="done-stat-label">{t('done.modulesCompleted')}</span>
          <span className="done-stat-value">{completedModules} / 5</span>
        </div>
        <div className="done-stat">
          <span className="done-stat-label">{t('done.humanLikelihood')}</span>
          <span className="done-stat-value">{humanLikelihood}</span>
        </div>
        <div className="done-stat" style={{ borderBottom: 'none' }}>
          <span className="done-stat-label">{t('done.qualityScore')}</span>
          <span className="done-stat-value">{Math.round(qualityScore * 100)}%</span>
        </div>
      </div>

      <button className="btn-primary" onClick={onReset}>
        {t('done.back')}
      </button>
    </div>
  );
}
