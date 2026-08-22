/**
 * LiveGuard — IdleScreen (start screen)
 *
 * Shield icon, short message (duration, no camera/mic), "Commencer" button.
 * Session resolution mirrors demoguard: POST to backend for a traced session,
 * fallback to local lg_* ID on any failure.
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { useState, useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { LIVEGUARD_SESSION_ENDPOINT } from '../liveguard/constants';
import { LanguagePill } from '../components/LanguagePill';

interface Props {
  onStart: (sessionPublicId: string, testScope?: string | null) => void;
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2 L4 6 V12 C4 17 7.5 20.5 12 22 C16.5 20.5 20 17 20 12 V6 L12 2 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M9 12 L11 14 L15 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 7 V12 L15 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function NoCameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 3 L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M21 8 V16 C21 17 20 18 19 18 H8 L3 21 V6 C3 5 4 4 5 4 H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IdleScreen({ onStart }: Props) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // No URL params needed — LiveGuard is self-service
  }, []);

  /**
   * Resolve a traced session from the backend.
   * Falls back to a local lg_* ID on any failure (network, rate limit, etc.).
   * The app never blocks the user.
   */
  async function ensureSession(): Promise<string> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(LIVEGUARD_SESSION_ENDPOINT, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'liveguard' }),
      });
      clearTimeout(timer);

      if (!res.ok) {
        console.warn('[IdleScreen] Session API returned', res.status, '— using fallback');
        return '';
      }
      const data = await res.json() as { sessionPublicId?: string };
      if (data.sessionPublicId && /^hcs_sess_[A-Za-z0-9_-]+$/.test(data.sessionPublicId)) {
        console.log('[IdleScreen] Session generated:', data.sessionPublicId);
        return data.sessionPublicId;
      }
      return '';
    } catch (err) {
      console.warn('[IdleScreen] Session API failed:', err, '— using fallback');
      return '';
    }
  }

  const handleStart = async () => {
    setLoading(true);
    let id = await ensureSession();
    if (!id) {
      id = `lg_${Date.now().toString(36)}`;
    }
    setLoading(false);
    onStart(id, 'cognitive-only');
  };

  return (
    <div className="screen screen-center">
      <LanguagePill />

      <div className="shield-icon">
        <ShieldIcon />
      </div>

      <h1 className="title-lg">{t('app.title')}</h1>
      <p className="subtitle" style={{ marginTop: 8, marginBottom: 32 }}>
        {t('app.subtitle')}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320, marginBottom: 32 }}>
        <div className="info-chip">
          <ClockIcon />
          {t('app.chip.duration')}
        </div>
        <div className="info-chip">
          <NoCameraIcon />
          {t('app.chip.noCamera')}
        </div>
      </div>

      <button className="btn-primary" onClick={handleStart} disabled={loading}>
        {loading ? '…' : t('app.start')}
      </button>
    </div>
  );
}
