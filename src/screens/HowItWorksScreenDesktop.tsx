/**
 * LiveGuard — HowItWorksScreen (DESKTOP version)
 *
 * Desktop-native layout for the "Comment fonctionne LiveGuard" page.
 * Reuses the exact same i18n keys and ensureSession logic as the mobile
 * HowItWorksScreen — only the layout and styling change.
 *
 * Key differences from mobile:
 * - 2-column editorial sections (icon left, text right, controlled width)
 * - Reading column max-width ~760px (no full-width text stretching)
 * - Desktop typography scale (h1 40px, h2 26px, body 17px)
 * - 3 step cards reuse the desktop landing step styles (ld-step-card)
 *
 * Routed via useDesktop() in App.tsx. Mobile uses HowItWorksScreen.tsx
 * (never modified by this variant).
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { useState, useCallback } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { useTheme } from '../hooks/useTheme';
import { LandingHeader } from '../components/LandingHeader';
import { LIVEGUARD_SESSION_ENDPOINT } from '../liveguard/constants';
import '../styles/howitworks-desktop.css';

interface Props {
  onTryDemo: (sessionPublicId: string) => void;
  onShowImplementation: () => void;
  onShowScenarios: (sessionPublicId: string) => void;
  onBackToLanding: () => void;
  /** Start the real test parcours (idle → select_protection → prep → tests). */
  onStartRealTest?: (sessionPublicId: string) => void;
}

export function HowItWorksScreenDesktop({ onTryDemo, onShowImplementation, onShowScenarios, onBackToLanding, onStartRealTest }: Props) {
  const { t } = useI18n();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  const ensureSession = useCallback(async (): Promise<string> => {
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
      if (!res.ok) return '';
      const data = await res.json() as { sessionPublicId?: string };
      return data.sessionPublicId && /^hcs_sess_[A-Za-z0-9_-]+$/.test(data.sessionPublicId)
        ? data.sessionPublicId : '';
    } catch { return ''; }
  }, []);

  const handleShowScenarios = useCallback(async () => {
    setLoading(true);
    let id = await ensureSession();
    if (!id) id = `lg_${Date.now().toString(36)}`;
    setLoading(false);
    onShowScenarios(id);
  }, [ensureSession, onShowScenarios]);

  const handleTryDemo = useCallback(async () => {
    setLoading(true);
    let id = await ensureSession();
    if (!id) id = `lg_${Date.now().toString(36)}`;
    setLoading(false);
    onTryDemo(id);
  }, [ensureSession, onTryDemo]);

  const handleStartRealTest = useCallback(async () => {
    setLoading(true);
    let id = await ensureSession();
    if (!id) id = `lg_${Date.now().toString(36)}`;
    setLoading(false);
    onStartRealTest?.(id);
  }, [ensureSession, onStartRealTest]);

  return (
    <div className="hiwd-page" data-theme={theme}>
      <LandingHeader onLogoClick={onBackToLanding} />

      {/* ── Title ── */}
      <section className="hiwd-title-section">
        <h1 className="hiwd-title">{t('hiw.title')}</h1>
      </section>

      {/* ── 3 step cards (reuse landing desktop step styles) ── */}
      <section className="hiwd-steps">
        <div className="hiwd-step-card" data-accent="violet">
          <span className="hiwd-step-num" aria-hidden="true">1</span>
          <p>{t('landing.step1')}</p>
        </div>
        <div className="hiwd-step-card" data-accent="blue">
          <span className="hiwd-step-num" aria-hidden="true">2</span>
          <p>{t('landing.step2')}</p>
        </div>
        <div className="hiwd-step-card" data-accent="cyan">
          <span className="hiwd-step-num" aria-hidden="true">3</span>
          <p>{t('landing.step3')}</p>
        </div>
      </section>

      {/* ── Editorial sections: 2-column (icon | text) ── */}
      <section className="hiwd-sections">
        {/* Continuous protection */}
        <article className="hiwd-section">
          <div className="hiwd-section-icon" data-accent="blue" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <defs>
                <linearGradient id="hiwd-g-continuous" x1="6" y1="6" x2="26" y2="26">
                  <stop stopColor="#4f7cff"/><stop offset="1" stopColor="#22c8ee"/>
                </linearGradient>
              </defs>
              <path d="M16 3.5 5.5 7.2v7c0 6.2 4.4 12 10.5 14.3C22.1 26.2 26.5 20.4 26.5 14.2v-7L16 3.5Z"
                    stroke="url(#hiwd-g-continuous)" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
              <circle cx="16" cy="14" r="4" stroke="url(#hiwd-g-continuous)" strokeWidth="1.5" fill="none"/>
              <path d="M16 12.5V14l1.5 1.5" stroke="url(#hiwd-g-continuous)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="hiwd-section-content">
            <h2 className="hiwd-section-title">{t('hiw.continuousTitle')}</h2>
            <p className="hiwd-section-text">{t('hiw.continuousText')}</p>
            <button type="button" className="hiwd-section-link" onClick={handleShowScenarios} disabled={loading}>
              {loading ? '…' : t('hiw.scenariosLink')}
            </button>
          </div>
        </article>

        {/* Learning system */}
        <article className="hiwd-section">
          <div className="hiwd-section-icon" data-accent="cyan" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <defs>
                <linearGradient id="hiwd-g-loop" x1="6" y1="6" x2="26" y2="26">
                  <stop stopColor="#22c8ee"/><stop offset="1" stopColor="#8b5cf6"/>
                </linearGradient>
              </defs>
              <path d="M7 16a9 9 0 0 1 15.5-6.2" stroke="url(#hiwd-g-loop)" strokeWidth="1.8"
                    strokeLinecap="round" fill="none"/>
              <path d="M25 16a9 9 0 0 1-15.5 6.2" stroke="url(#hiwd-g-loop)" strokeWidth="1.8"
                    strokeLinecap="round" fill="none"/>
              <path d="M23 5.5 22.5 9.8 26.8 9.3" stroke="url(#hiwd-g-loop)" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M9 26.5 9.5 22.2 5.2 22.7" stroke="url(#hiwd-g-loop)" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="16" cy="16" r="2.5" fill="url(#hiwd-g-loop)"/>
            </svg>
          </div>
          <div className="hiwd-section-content">
            <h2 className="hiwd-section-title">{t('hiw.learningTitle')}</h2>
            <p className="hiwd-section-text">{t('hiw.learningText')}</p>
          </div>
        </article>

        {/* Why exercises */}
        <article className="hiwd-section">
          <div className="hiwd-section-icon" data-accent="violet" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <defs>
                <linearGradient id="hiwd-g-shield" x1="6" y1="6" x2="26" y2="26">
                  <stop stopColor="#8b5cf6"/><stop offset="1" stopColor="#4f7cff"/>
                </linearGradient>
              </defs>
              <path d="M16 3.5 5.5 7.2v7c0 6.2 4.4 12 10.5 14.3C22.1 26.2 26.5 20.4 26.5 14.2v-7L16 3.5Z"
                    stroke="url(#hiwd-g-shield)" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
              <path d="m11.5 15.5 3 3 6-6.5" stroke="url(#hiwd-g-shield)" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <div className="hiwd-section-content">
            <h2 className="hiwd-section-title">{t('hiw.whyTitle')}</h2>
            <p className="hiwd-section-text">{t('hiw.whyText')}</p>
          </div>
        </article>

        {/* Bad day */}
        <article className="hiwd-section">
          <div className="hiwd-section-icon" data-accent="cyan" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <defs>
                <linearGradient id="hiwd-g-heart" x1="6" y1="6" x2="26" y2="26">
                  <stop stopColor="#22c8ee"/><stop offset="1" stopColor="#34d399"/>
                </linearGradient>
              </defs>
              <path d="M16 27.5S5 20.5 5 12.5C5 8.4 8.4 5 12.5 5c1.7 0 3 .6 3.5 1C16.6 5.6 17.8 5 19.5 5 23.6 5 27 8.4 27 12.5c0 8-11 15-11 15Z"
                    stroke="url(#hiwd-g-heart)" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
              <path d="M16 12v5" stroke="url(#hiwd-g-heart)" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="16" cy="19.5" r="1" fill="url(#hiwd-g-heart)"/>
            </svg>
          </div>
          <div className="hiwd-section-content">
            <h2 className="hiwd-section-title">{t('hiw.badDayTitle')}</h2>
            <p className="hiwd-section-text">{t('hiw.badDayText')}</p>
          </div>
        </article>

        {/* Privacy */}
        <article className="hiwd-section">
          <div className="hiwd-section-icon" data-accent="blue" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <defs>
                <linearGradient id="hiwd-g-lock" x1="6" y1="6" x2="26" y2="26">
                  <stop stopColor="#4f7cff"/><stop offset="1" stopColor="#22c8ee"/>
                </linearGradient>
              </defs>
              <rect x="6" y="14" width="20" height="14" rx="3.5" stroke="url(#hiwd-g-lock)" strokeWidth="1.8" fill="none"/>
              <path d="M11 14v-3.5a5 5 0 0 1 10 0V14" stroke="url(#hiwd-g-lock)" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
              <circle cx="16" cy="20" r="1.8" fill="url(#hiwd-g-lock)"/>
              <path d="M16 21.8v2.2" stroke="url(#hiwd-g-lock)" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="hiwd-section-content">
            <h2 className="hiwd-section-title">{t('hiw.privacyTitle')}</h2>
            <p className="hiwd-section-text">{t('hiw.privacyText')}</p>
            <ul className="hiwd-privacy-list">
              <li className="hiwd-privacy-item hiwd-privacy-item--never">
                <span className="hiwd-privacy-icon" aria-hidden="true">✕</span>
                {t('hiw.privacyNever1')}
              </li>
              <li className="hiwd-privacy-item hiwd-privacy-item--never">
                <span className="hiwd-privacy-icon" aria-hidden="true">✕</span>
                {t('hiw.privacyNever2')}
              </li>
              <li className="hiwd-privacy-item hiwd-privacy-item--never">
                <span className="hiwd-privacy-icon" aria-hidden="true">✕</span>
                {t('hiw.privacyNever3')}
              </li>
              <li className="hiwd-privacy-item hiwd-privacy-item--only">
                <span className="hiwd-privacy-icon" aria-hidden="true">✓</span>
                {t('hiw.privacyOnly')}
              </li>
            </ul>
          </div>
        </article>
      </section>

      {/* ── CTAs ── */}
      <div className="hiwd-ctas">
        <button className="hiwd-btn hiwd-btn-primary" onClick={handleTryDemo} disabled={loading}>
          <span>{loading ? '…' : t('hiw.ctaPrimary')}</span>
          {!loading && <span aria-hidden="true">→</span>}
        </button>
        <button className="hiwd-btn hiwd-btn-outline" onClick={onShowImplementation}>
          <span>{t('hiw.ctaSecondary')}</span>
          <span aria-hidden="true">→</span>
        </button>
        {onStartRealTest && (
          <button className="hiwd-btn hiwd-btn-outline" onClick={handleStartRealTest} disabled={loading}>
            <span>{loading ? '…' : t('landing.realTestCta')}</span>
            {!loading && <span aria-hidden="true">→</span>}
          </button>
        )}
      </div>
    </div>
  );
}
