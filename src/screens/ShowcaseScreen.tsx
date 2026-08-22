/**
 * LiveGuard — ShowcaseScreen (landing page for partners)
 *
 * Replaces IdleScreen as the entry point. Presents LiveGuard as a
 * behavioral verification concept demo, with two paths:
 *   - "Essayer la démo" → resolves session, dispatches START → 5 cognitive tests
 *   - "Comment ça s'intègre" → dispatches SHOW_INTEGRATION
 *
 * Honest messaging: positions LiveGuard as an embedded SDK model
 * (same category as BioCatch/Incognia), validated in production on UniPay.
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { LIVEGUARD_SESSION_ENDPOINT } from '../liveguard/constants';
import { LanguagePill } from '../components/LanguagePill';

interface Props {
  onTryDemo: (sessionPublicId: string) => void;
  onShowIntegration: () => void;
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden width="48" height="48">
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

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden width="20" height="20">
      <path d="M8 5 V19 L19 12 Z" fill="currentColor" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden width="20" height="20">
      <path d="M5 12 H19 M13 6 L19 12 L13 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ShowcaseScreen({ onTryDemo, onShowIntegration }: Props) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

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
        console.warn('[ShowcaseScreen] Session API returned', res.status, '— using fallback');
        return '';
      }
      const data = await res.json() as { sessionPublicId?: string };
      if (data.sessionPublicId && /^hcs_sess_[A-Za-z0-9_-]+$/.test(data.sessionPublicId)) {
        return data.sessionPublicId;
      }
      return '';
    } catch (err) {
      console.warn('[ShowcaseScreen] Session API failed:', err, '— using fallback');
      return '';
    }
  }

  const handleTryDemo = async () => {
    setLoading(true);
    let id = await ensureSession();
    if (!id) {
      id = `lg_${Date.now().toString(36)}`;
    }
    setLoading(false);
    onTryDemo(id);
  };

  return (
    <div className="screen screen-center showcase-screen">
      <LanguagePill />

      <div className="shield-icon showcase-shield">
        <ShieldIcon />
      </div>

      <h1 className="title-lg">{t('showcase.title')}</h1>
      <p className="subtitle showcase-tagline" style={{ marginTop: 8, marginBottom: 24 }}>
        {t('showcase.tagline')}
      </p>

      <p className="showcase-description">
        {t('showcase.description')}
      </p>

      <div className="showcase-reference">
        {t('showcase.reference')}
      </div>

      <div className="showcase-actions">
        <button
          className="btn-primary showcase-btn-primary"
          onClick={handleTryDemo}
          disabled={loading}
        >
          <PlayIcon />
          {loading ? '…' : t('showcase.tryDemo')}
        </button>

        <button
          className="btn-secondary showcase-btn-secondary"
          onClick={onShowIntegration}
        >
          {t('showcase.howItIntegrates')}
          <ArrowRightIcon />
        </button>
      </div>

      <div className="showcase-footer">
        {t('showcase.footer')}
      </div>
    </div>
  );
}
