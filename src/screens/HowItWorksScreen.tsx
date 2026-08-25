/**
 * LiveGuard — HowItWorksScreen ("Comment ça fonctionne" — public)
 *
 * Reassures a first-time visitor before they try the cognitive check.
 * Answers unspoken doubts: why exercises instead of photo/voice,
 * what happens on a bad day, what data is (never) collected.
 *
 * Tone: warm, pedagogical, reassuring. Never clinical or scary.
 * No specific duration mentioned.
 *
 * Two CTAs at bottom:
 *   - Primary: "Essayer maintenant" → onTryDemo → cognitive tests
 *   - Secondary: "Vous êtes une entreprise ?" → onShowImplementation
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { useState, useCallback } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { LandingHeader } from '../components/LandingHeader';
import { LIVEGUARD_SESSION_ENDPOINT } from '../liveguard/constants';

interface Props {
  onTryDemo: (sessionPublicId: string) => void;
  onShowImplementation: () => void;
  onShowScenarios: (sessionPublicId: string) => void;
  onBackToLanding: () => void;
  /** Start the real test parcours (idle → select_protection → prep → tests). */
  onStartRealTest?: (sessionPublicId: string) => void;
}

export function HowItWorksScreen({ onTryDemo, onShowImplementation, onShowScenarios, onBackToLanding, onStartRealTest }: Props) {
  const { t } = useI18n();
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
    <div className="landing-page hiw-page">
      <LandingHeader onLogoClick={onBackToLanding} />

      {/* ── Title ── */}
      <section className="hiw-title-section">
        <h1 className="hiw-title">{t('hiw.title')}</h1>
      </section>

      {/* ── The 3 steps (reuse exact landing copy) ── */}
      <section className="landing-steps">
        <ol className="landing-step-list">
          <li className="landing-step-card" data-accent="violet">
            <span className="landing-step-num" aria-hidden="true">1</span>
            <p>{t('landing.step1')}</p>
            <span className="landing-step-icon" data-accent="violet" aria-hidden="true">
              <svg viewBox="0 0 32 32" fill="none">
                <defs>
                  <linearGradient id="hiw-g-puzzle" x1="6" y1="6" x2="26" y2="26">
                    <stop stopColor="#8b5cf6"/><stop offset="1" stopColor="#22c8ee"/>
                  </linearGradient>
                </defs>
                <path d="M13.6 6.4a2.9 2.9 0 0 1 5.8 0v1.1h3.2a2.4 2.4 0 0 1 2.4 2.4v3h1.1a2.9 2.9 0 0 1 0 5.8H25v3.2a2.4 2.4 0 0 1-2.4 2.4h-3v-1.1a2.9 2.9 0 0 0-5.8 0v1.1h-3.2a2.4 2.4 0 0 1-2.4-2.4v-3H7.3a2.9 2.9 0 0 1 0-5.8h1.1v-3A2.4 2.4 0 0 1 10.8 7.5h2.8V6.4Z"
                      fill="url(#hiw-g-puzzle)" transform="translate(-2.5 -1.5)"/>
              </svg>
            </span>
          </li>
          <li className="landing-step-card" data-accent="blue">
            <span className="landing-step-num" aria-hidden="true">2</span>
            <p>{t('landing.step2')}</p>
            <span className="landing-step-icon" data-accent="blue" aria-hidden="true">
              <svg viewBox="0 0 32 32" fill="none">
                <defs>
                  <linearGradient id="hiw-g-nocam" x1="6" y1="8" x2="26" y2="26">
                    <stop stopColor="#4f7cff"/><stop offset="1" stopColor="#22c8ee"/>
                  </linearGradient>
                </defs>
                <rect x="4.5" y="10" width="15" height="12" rx="3" fill="url(#hiw-g-nocam)"/>
                <circle cx="12" cy="16" r="2.6" fill="#fff"/>
                <path d="M19.5 14.5 25 11v10l-5.5-3.5" stroke="url(#hiw-g-nocam)" strokeWidth="2.2" strokeLinejoin="round" fill="none"/>
                <line x1="5" y1="6.5" x2="27" y2="25.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round"/>
              </svg>
            </span>
          </li>
          <li className="landing-step-card" data-accent="cyan">
            <span className="landing-step-num" aria-hidden="true">3</span>
            <p>{t('landing.step3')}</p>
            <span className="landing-step-icon" data-accent="cyan" aria-hidden="true">
              <svg viewBox="0 0 32 32" fill="none">
                <defs>
                  <linearGradient id="hiw-g-eye" x1="5" y1="9" x2="27" y2="23">
                    <stop stopColor="#22c8ee"/><stop offset="1" stopColor="#8b5cf6"/>
                  </linearGradient>
                </defs>
                <path d="M3.5 16S8 8.5 16 8.5 28.5 16 28.5 16 24 23.5 16 23.5 3.5 16 3.5 16Z"
                      stroke="url(#hiw-g-eye)" strokeWidth="2" fill="none" strokeLinejoin="round"/>
                <path d="M16 12.2a3.8 3.8 0 0 1 3.8 3.8c0 1.5-.9 2.8-2.2 3.4" stroke="url(#hiw-g-eye)" strokeWidth="1.7" strokeLinecap="round" fill="none"/>
                <path d="M16 14.2a1.8 1.8 0 0 1 1.8 1.8" stroke="url(#hiw-g-eye)" strokeWidth="1.7" strokeLinecap="round" fill="none"/>
                <circle cx="16" cy="16" r=".9" fill="url(#hiw-g-eye)"/>
              </svg>
            </span>
          </li>
        </ol>
      </section>

      {/* ── Section: Continuous protection, not just at login ── */}
      <section className="hiw-section">
        <div className="hiw-section-icon" data-accent="blue" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="hiw-g-continuous" x1="6" y1="6" x2="26" y2="26">
                <stop stopColor="#4f7cff"/><stop offset="1" stopColor="#22c8ee"/>
              </linearGradient>
            </defs>
            <path d="M16 3.5 5.5 7.2v7c0 6.2 4.4 12 10.5 14.3C22.1 26.2 26.5 20.4 26.5 14.2v-7L16 3.5Z"
                  stroke="url(#hiw-g-continuous)" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
            <circle cx="16" cy="14" r="4" stroke="url(#hiw-g-continuous)" strokeWidth="1.5" fill="none"/>
            <path d="M16 12.5V14l1.5 1.5" stroke="url(#hiw-g-continuous)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="hiw-section-title">{t('hiw.continuousTitle')}</h2>
        <p className="hiw-section-text">{t('hiw.continuousText')}</p>
        <button type="button" className="hiw-section-link" onClick={handleShowScenarios} disabled={loading}>
          {loading ? '…' : t('hiw.scenariosLink')}
        </button>
      </section>

      {/* ── Section: Learning system, not a fixed secret ── */}
      <section className="hiw-section">
        <div className="hiw-section-icon" data-accent="cyan" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="hiw-g-loop" x1="6" y1="6" x2="26" y2="26">
                <stop stopColor="#22c8ee"/><stop offset="1" stopColor="#8b5cf6"/>
              </linearGradient>
            </defs>
            <path d="M7 16a9 9 0 0 1 15.5-6.2" stroke="url(#hiw-g-loop)" strokeWidth="1.8"
                  strokeLinecap="round" fill="none"/>
            <path d="M25 16a9 9 0 0 1-15.5 6.2" stroke="url(#hiw-g-loop)" strokeWidth="1.8"
                  strokeLinecap="round" fill="none"/>
            <path d="M23 5.5 22.5 9.8 26.8 9.3" stroke="url(#hiw-g-loop)" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M9 26.5 9.5 22.2 5.2 22.7" stroke="url(#hiw-g-loop)" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <circle cx="16" cy="16" r="2.5" fill="url(#hiw-g-loop)"/>
          </svg>
        </div>
        <h2 className="hiw-section-title">{t('hiw.learningTitle')}</h2>
        <p className="hiw-section-text">{t('hiw.learningText')}</p>
      </section>

      {/* ── Section: Why exercises instead of photo/voice ── */}
      <section className="hiw-section">
        <div className="hiw-section-icon" data-accent="violet" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="hiw-g-shield" x1="6" y1="6" x2="26" y2="26">
                <stop stopColor="#8b5cf6"/><stop offset="1" stopColor="#4f7cff"/>
              </linearGradient>
            </defs>
            <path d="M16 3.5 5.5 7.2v7c0 6.2 4.4 12 10.5 14.3C22.1 26.2 26.5 20.4 26.5 14.2v-7L16 3.5Z"
                  stroke="url(#hiw-g-shield)" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
            <path d="m11.5 15.5 3 3 6-6.5" stroke="url(#hiw-g-shield)" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </div>
        <h2 className="hiw-section-title">{t('hiw.whyTitle')}</h2>
        <p className="hiw-section-text">{t('hiw.whyText')}</p>
      </section>

      {/* ── Section: Bad day / new phone ── */}
      <section className="hiw-section">
        <div className="hiw-section-icon" data-accent="cyan" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="hiw-g-heart" x1="6" y1="6" x2="26" y2="26">
                <stop stopColor="#22c8ee"/><stop offset="1" stopColor="#34d399"/>
              </linearGradient>
            </defs>
            <path d="M16 27.5S5 20.5 5 12.5C5 8.4 8.4 5 12.5 5c1.7 0 3 .6 3.5 1C16.6 5.6 17.8 5 19.5 5 23.6 5 27 8.4 27 12.5c0 8-11 15-11 15Z"
                  stroke="url(#hiw-g-heart)" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
            <path d="M16 12v5" stroke="url(#hiw-g-heart)" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="16" cy="19.5" r="1" fill="url(#hiw-g-heart)"/>
          </svg>
        </div>
        <h2 className="hiw-section-title">{t('hiw.badDayTitle')}</h2>
        <p className="hiw-section-text">{t('hiw.badDayText')}</p>
      </section>

      {/* ── Section: Privacy ── */}
      <section className="hiw-section">
        <div className="hiw-section-icon" data-accent="blue" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="hiw-g-lock" x1="6" y1="6" x2="26" y2="26">
                <stop stopColor="#4f7cff"/><stop offset="1" stopColor="#22c8ee"/>
              </linearGradient>
            </defs>
            <rect x="6" y="14" width="20" height="14" rx="3.5" stroke="url(#hiw-g-lock)" strokeWidth="1.8" fill="none"/>
            <path d="M11 14v-3.5a5 5 0 0 1 10 0V14" stroke="url(#hiw-g-lock)" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            <circle cx="16" cy="20" r="1.8" fill="url(#hiw-g-lock)"/>
            <path d="M16 21.8v2.2" stroke="url(#hiw-g-lock)" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
        <h2 className="hiw-section-title">{t('hiw.privacyTitle')}</h2>
        <p className="hiw-section-text">{t('hiw.privacyText')}</p>
        <ul className="hiw-privacy-list">
          <li className="hiw-privacy-item hiw-privacy-item--never">
            <span className="hiw-privacy-icon" aria-hidden="true">✕</span>
            {t('hiw.privacyNever1')}
          </li>
          <li className="hiw-privacy-item hiw-privacy-item--never">
            <span className="hiw-privacy-icon" aria-hidden="true">✕</span>
            {t('hiw.privacyNever2')}
          </li>
          <li className="hiw-privacy-item hiw-privacy-item--never">
            <span className="hiw-privacy-icon" aria-hidden="true">✕</span>
            {t('hiw.privacyNever3')}
          </li>
          <li className="hiw-privacy-item hiw-privacy-item--only">
            <span className="hiw-privacy-icon" aria-hidden="true">✓</span>
            {t('hiw.privacyOnly')}
          </li>
        </ul>
      </section>

      {/* ── CTAs ── */}
      <div className="landing-ctas">
        <button className="landing-btn landing-btn-primary" onClick={handleTryDemo} disabled={loading}>
          <span>{loading ? '…' : t('hiw.ctaPrimary')}</span>
          {!loading && <span aria-hidden="true">→</span>}
        </button>
        <button className="landing-btn landing-btn-secondary" onClick={onShowImplementation}>
          <span>{t('hiw.ctaSecondary')}</span>
          <span aria-hidden="true">→</span>
        </button>
        {onStartRealTest && (
          <button className="landing-btn landing-btn-secondary" onClick={handleStartRealTest} disabled={loading}>
            <span>{loading ? '…' : t('landing.realTestCta')}</span>
            {!loading && <span aria-hidden="true">→</span>}
          </button>
        )}
      </div>
    </div>
  );
}
