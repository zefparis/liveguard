/**
 * LiveGuard — PrepScreen (device + permissions + continuous signals start)
 *
 * Two-phase flow:
 *   1. useEffect auto-collects device context + permission status (no user
 *      gesture needed — these are read-only queries).
 *   2. A "Continue" button is shown. Its onClick handler calls
 *      onUserContinue(perms) which triggers requestSensorPermissions()
 *      (iOS 13+ requires requestPermission() from a user gesture) then
 *      start() then onReady().
 *
 * On Android/desktop where requestPermission() does not exist, the button
 * still works — requestSensorPermissions() returns immediately and start()
 * registers listeners with permission='granted'.
 *
 * Consent screen: before the sensor "Continue" button, a consent screen is
 * shown informing the user that behavioral data from this session is used to
 * train the detection model. The user must explicitly accept before
 * collection starts. A "Learn more" link opens the privacy policy page.
 * The consent screen is skipped for demo and reverify sessions
 * (protectionCategory === 'demo' or 'reverify').
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { useEffect, useState } from 'react';
import { collectDeviceContext } from '../liveguard/collectors/deviceCollector';
import { collectPermissions } from '../liveguard/collectors/permissionCollector';
import { PhaseHeader } from '../components/PhaseHeader';
import { useI18n } from '../i18n/I18nContext';
import type { LiveGuardPermissions } from '../liveguard/types';

interface Props {
  onDeviceCollected: (device: ReturnType<typeof collectDeviceContext>) => void;
  onPermissionsCollected: (perms: LiveGuardPermissions) => void;
  /**
   * Called synchronously from the Continue button onClick handler.
   * MUST trigger requestSensorPermissions() + start() within the same
   * user-activation window. Resolves when continuous signals are started.
   */
  onUserContinue: (perms: LiveGuardPermissions) => Promise<void>;
  onReady: () => void;
  onError: (reason: string) => void;
  /** Navigate to the privacy policy legal page. */
  onShowLegalPrivacy?: () => void;
  /** Called when the user accepts the consent screen. */
  onConsentAccepted?: () => void;
  /** Skip consent for demo/reverify sessions. */
  skipConsent?: boolean;
}

export function PrepScreen({
  onDeviceCollected,
  onPermissionsCollected,
  onUserContinue,
  onReady,
  onError,
  onShowLegalPrivacy,
  onConsentAccepted,
  skipConsent,
}: Props) {
  const { t } = useI18n();
  const [perms, setPerms] = useState<LiveGuardPermissions | null>(null);
  const [starting, setStarting] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(skipConsent ?? false);

  // Phase 1: auto-collect device + permission status (read-only, no gesture needed)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const device = collectDeviceContext();
        if (cancelled) return;
        onDeviceCollected(device);

        const collected = await collectPermissions();
        if (cancelled) return;
        onPermissionsCollected(collected);
        setPerms(collected);
      } catch (err) {
        if (!cancelled) onError(err instanceof Error ? err.message : 'Prep failed');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Phase 2: user clicks Continue → requestSensorPermissions() + start() + onReady()
  const handleContinue = async () => {
    if (!perms || starting) return;
    setStarting(true);
    try {
      await onUserContinue(perms);
      onReady();
    } catch (err) {
      setStarting(false);
      onError(err instanceof Error ? err.message : 'Sensor start failed');
    }
  };

  const handleAcceptConsent = () => {
    setConsentAccepted(true);
    onConsentAccepted?.();
  };

  return (
    <div className="screen">
      <PhaseHeader title={t('prep.title')} progress={t('prep.progress')} progressPct={0} />
      <div className="screen-center">
        {perms && !consentAccepted ? (
          <>
            <div style={{ fontSize: 32 }}>🧠</div>
            <p style={{ fontWeight: 600, maxWidth: 320, lineHeight: 1.5 }}>
              {t('prep.consent.title')}
            </p>
            <p className="muted" style={{ maxWidth: 320, lineHeight: 1.5 }}>
              {t('prep.consent.body')}
            </p>
            {onShowLegalPrivacy && (
              <button
                type="button"
                onClick={onShowLegalPrivacy}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--lg-accent, #6366f1)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: 14,
                  padding: 0,
                }}
              >
                {t('prep.consent.learnMore')}
              </button>
            )}
            <button
              className="prep-continue-btn"
              onClick={handleAcceptConsent}
            >
              {t('prep.consent.accept')}
            </button>
            <button
              type="button"
              onClick={() => onError('consent_declined')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--lg-muted, #94a3b8)',
                cursor: 'pointer',
                fontSize: 14,
                marginTop: 4,
              }}
            >
              {t('prep.consent.decline')}
            </button>
          </>
        ) : perms ? (
          <>
            <div style={{ fontSize: 32 }}>⚙️</div>
            <p className="muted">{t('prep.ready')}</p>
            <button
              className="prep-continue-btn"
              onClick={handleContinue}
              disabled={starting}
            >
              {starting ? '…' : t('prep.continue')}
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 32 }}>⚙️</div>
            <p className="muted">{t('prep.collecting')}</p>
          </>
        )}
      </div>
    </div>
  );
}
