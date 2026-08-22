/**
 * LiveGuard — ReviewScreen (signal review + behavior collection)
 *
 * Adapted from demoguard: removed selfie/voice review sections.
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { PhaseHeader } from '../components/PhaseHeader';
import type { LiveGuardState } from '../state/liveguardReducer';
import type { BehaviorPayload } from '../liveguard/behavior/behaviorTypes';
import { useI18n } from '../i18n/I18nContext';

interface Props {
  state: LiveGuardState;
  behaviorPayload: BehaviorPayload | null;
  onContinue: () => void;
  onError: (reason: string) => void;
}

export function ReviewScreen({ state, behaviorPayload, onContinue }: Props) {
  const { t } = useI18n();
  const cognitive = state.cognitiveSignals;
  const cogModules = cognitive
    ? [
        { name: t('review.module.reflex'), signal: cognitive.reflex },
        { name: t('review.module.stroop'), signal: cognitive.stroop },
        { name: t('review.module.digitSpan'), signal: cognitive.digit_span },
        { name: t('review.module.nback'), signal: cognitive.n_back },
        { name: t('review.module.trailTap'), signal: cognitive.trail_tap },
      ]
    : [];

  return (
    <div className="screen">
      <PhaseHeader title={t('review.title')} progress={t('review.progress')} progressPct={90} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="card">
          <h3 style={{ marginBottom: 8 }}>{t('review.cognitive')}</h3>
          {cogModules.map((m) => (
            <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>{m.name}</span>
              <span className="text-muted">{m.signal ? '✅' : '—'}</span>
            </div>
          ))}
        </div>
        {behaviorPayload && (
          <div className="card">
            <h3 style={{ marginBottom: 8 }}>{t('review.behavior')}</h3>
            <p className="text-muted">{t('review.interactions')}: {behaviorPayload.summary.totalInteractions}</p>
            <p className="text-muted">{t('review.tasksObserved')}: {behaviorPayload.summary.tasksObserved}</p>
            <p className="text-muted">{t('review.quality')}: {behaviorPayload.summary.quality}</p>
          </div>
        )}
        <button className="btn-primary" onClick={onContinue} style={{ marginTop: 8 }}>
          {t('review.continue')}
        </button>
      </div>
    </div>
  );
}
