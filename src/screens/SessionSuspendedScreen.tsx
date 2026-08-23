/**
 * LiveGuard — Session Suspended Screen
 *
 * Shown when the behavioral beacon detects divergence and the session
 * is invalidated. Offers re-verification via the existing LiveGuard
 * cognitive test flow (prep → 5 tests → done).
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { useI18n } from '../i18n/I18nContext';

interface Props {
  reason: string;
  onReverify: () => void;
  onBack: () => void;
}

export function SessionSuspendedScreen({ reason, onReverify, onBack }: Props) {
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
      <button
        className="btn"
        onClick={onReverify}
        style={{ marginTop: 24, width: '80%' }}
      >
        {t('demo.reverifyButton')}
      </button>
      <button
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
