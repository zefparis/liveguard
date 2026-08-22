/**
 * LiveGuard — LandingScreen (unified home page at "/")
 *
 * Replaces the old ShowcaseScreen with the polished Kimi K3 landing design:
 * adaptive light/dark, gradient glow accents, network mesh, protectable-things
 * tiles, 3 numbered steps, UniPay social proof, partner link.
 *
 * Two CTAs:
 *   - "Essayer" → onTryDemo (resolves session, dispatches START → 5 cognitive tests)
 *   - "Comment ça fonctionne" → smooth scroll to #steps section
 * Partner link → onShowIntegration (IntegrationScreen)
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
  onShowHowItWorks: () => void;
  onShowImplementation: () => void;
}

export function LandingScreen({ onTryDemo, onShowHowItWorks, onShowImplementation }: Props) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  // ── Session resolution (same logic as old ShowcaseScreen) ──
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
      if (!res.ok) {
        console.warn('[LandingScreen] Session API returned', res.status, '— using fallback');
        return '';
      }
      const data = await res.json() as { sessionPublicId?: string };
      if (data.sessionPublicId && /^hcs_sess_[A-Za-z0-9_-]+$/.test(data.sessionPublicId)) {
        return data.sessionPublicId;
      }
      return '';
    } catch (err) {
      console.warn('[LandingScreen] Session API failed:', err, '— using fallback');
      return '';
    }
  }, []);

  const handleTryDemo = useCallback(async () => {
    setLoading(true);
    let id = await ensureSession();
    if (!id) {
      id = `lg_${Date.now().toString(36)}`;
    }
    setLoading(false);
    onTryDemo(id);
  }, [ensureSession, onTryDemo]);

  return (
    <div className="landing-page">
      {/* ── 1. Header ── */}
      <LandingHeader />

      {/* ── 2. Protectable-things tiles ── */}
      <section className="landing-tiles" aria-label={t('landing.tilesLabel')}>
        {/* Wallet */}
        <div className="landing-tile" data-accent="blue">
          <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="lg-g-wallet" x1="6" y1="6" x2="27" y2="27">
                <stop stopColor="#4f7cff"/><stop offset="1" stopColor="#22c8ee"/>
              </linearGradient>
            </defs>
            <rect x="4.5" y="8.5" width="23" height="16" rx="4.5" fill="url(#lg-g-wallet)"/>
            <path d="M4.5 13c0-2.5 2-4.5 4.5-4.5h12.5" stroke="#fff" strokeOpacity=".65" strokeWidth="1.6" strokeLinecap="round"/>
            <circle cx="22.5" cy="16.5" r="1.8" fill="#fff"/>
          </svg>
        </div>
        {/* Locked document */}
        <div className="landing-tile" data-accent="violet">
          <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="lg-g-doc" x1="7" y1="4" x2="26" y2="28">
                <stop stopColor="#8b5cf6"/><stop offset="1" stopColor="#4f7cff"/>
              </linearGradient>
            </defs>
            <path d="M9 4.5h9l5.5 5.5V26a2.5 2.5 0 0 1-2.5 2.5H9A2.5 2.5 0 0 1 6.5 26V7A2.5 2.5 0 0 1 9 4.5Z" fill="url(#lg-g-doc)"/>
            <path d="M17.5 4.8v5h5.2" stroke="#fff" strokeOpacity=".6" strokeWidth="1.5" strokeLinejoin="round"/>
            <rect x="12.4" y="17.4" width="7.2" height="5.6" rx="1.4" fill="#fff"/>
            <path d="M14 17.4v-1.8a2 2 0 0 1 4 0v1.8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </div>
        {/* Locked message */}
        <div className="landing-tile" data-accent="cyan">
          <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="lg-g-msg" x1="5" y1="6" x2="27" y2="27">
                <stop stopColor="#22c8ee"/><stop offset="1" stopColor="#8b5cf6"/>
              </linearGradient>
            </defs>
            <path d="M7 5.5h18A3.5 3.5 0 0 1 28.5 9v8a3.5 3.5 0 0 1-3.5 3.5H14l-5.4 4.6c-.8.7-2.1.1-2.1-1V9A3.5 3.5 0 0 1 10 5.5Z" fill="url(#lg-g-msg)"/>
            <rect x="13.4" y="11.4" width="5.2" height="4.2" rx="1" fill="#fff"/>
            <path d="M14.6 11.4V10a1.4 1.4 0 0 1 2.8 0v1.4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>
        {/* And more */}
        <div className="landing-tile" data-accent="indigo">
          <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="lg-g-dots" x1="5" y1="16" x2="27" y2="16">
                <stop stopColor="#4f7cff"/><stop offset="1" stopColor="#8b5cf6"/>
              </linearGradient>
            </defs>
            <circle cx="7.5" cy="16" r="2.6" fill="url(#lg-g-dots)"/>
            <circle cx="16" cy="16" r="2.6" fill="url(#lg-g-dots)"/>
            <circle cx="24.5" cy="16" r="2.6" fill="url(#lg-g-dots)"/>
          </svg>
        </div>
      </section>

      {/* ── 3. Hero ── */}
      <section className="landing-hero">
        <svg className="landing-mesh" viewBox="0 0 400 260" aria-hidden="true">
          <g>
            <line x1="30" y1="42" x2="92" y2="26"/><line x1="92" y1="26" x2="152" y2="60"/>
            <line x1="152" y1="60" x2="212" y2="30"/><line x1="212" y1="30" x2="282" y2="56"/>
            <line x1="282" y1="56" x2="352" y2="34"/><line x1="30" y1="42" x2="62" y2="118"/>
            <line x1="62" y1="118" x2="132" y2="148"/><line x1="132" y1="148" x2="202" y2="118"/>
            <line x1="202" y1="118" x2="272" y2="158"/><line x1="272" y1="158" x2="342" y2="128"/>
            <line x1="92" y1="26" x2="62" y2="118"/><line x1="152" y1="60" x2="132" y2="148"/>
            <line x1="212" y1="30" x2="202" y2="118"/><line x1="282" y1="56" x2="272" y2="158"/>
            <line x1="352" y1="34" x2="342" y2="128"/><line x1="62" y1="118" x2="94" y2="212"/>
            <line x1="132" y1="148" x2="94" y2="212"/><line x1="132" y1="148" x2="172" y2="228"/>
            <line x1="202" y1="118" x2="172" y2="228"/><line x1="272" y1="158" x2="252" y2="222"/>
            <line x1="342" y1="128" x2="332" y2="238"/><line x1="94" y1="212" x2="172" y2="228"/>
            <line x1="172" y1="228" x2="252" y2="222"/><line x1="252" y1="222" x2="332" y2="238"/>
          </g>
          <g>
            <circle cx="30" cy="42" r="2.6"/><circle cx="92" cy="26" r="2.2"/>
            <circle cx="152" cy="60" r="3"/><circle cx="212" cy="30" r="2.2"/>
            <circle cx="282" cy="56" r="2.6"/><circle cx="352" cy="34" r="2.2"/>
            <circle cx="62" cy="118" r="2.6"/><circle cx="132" cy="148" r="3"/>
            <circle cx="202" cy="118" r="2.6"/><circle cx="272" cy="158" r="2.2"/>
            <circle cx="342" cy="128" r="2.6"/><circle cx="94" cy="212" r="2.2"/>
            <circle cx="172" cy="228" r="2.6"/><circle cx="252" cy="222" r="2.2"/>
            <circle cx="332" cy="238" r="2.6"/>
          </g>
        </svg>
        <div className="landing-hero-content">
          <h1>{t('landing.heroTitle')}</h1>
          <p className="landing-lede">{t('landing.heroSub')}</p>
        </div>
      </section>

      {/* ── 4. Three steps ── */}
      <section className="landing-steps" id="steps">
        <ol className="landing-step-list">
          <li className="landing-step-card" data-accent="violet">
            <span className="landing-step-num" aria-hidden="true">1</span>
            <p>{t('landing.step1')}</p>
            <span className="landing-step-icon" data-accent="violet" aria-hidden="true">
              <svg viewBox="0 0 32 32" fill="none">
                <defs>
                  <linearGradient id="lg-g-puzzle" x1="6" y1="6" x2="26" y2="26">
                    <stop stopColor="#8b5cf6"/><stop offset="1" stopColor="#22c8ee"/>
                  </linearGradient>
                </defs>
                <path d="M13.6 6.4a2.9 2.9 0 0 1 5.8 0v1.1h3.2a2.4 2.4 0 0 1 2.4 2.4v3h1.1a2.9 2.9 0 0 1 0 5.8H25v3.2a2.4 2.4 0 0 1-2.4 2.4h-3v-1.1a2.9 2.9 0 0 0-5.8 0v1.1h-3.2a2.4 2.4 0 0 1-2.4-2.4v-3H7.3a2.9 2.9 0 0 1 0-5.8h1.1v-3A2.4 2.4 0 0 1 10.8 7.5h2.8V6.4Z"
                      fill="url(#lg-g-puzzle)" transform="translate(-2.5 -1.5)"/>
              </svg>
            </span>
          </li>
          <li className="landing-step-card" data-accent="blue">
            <span className="landing-step-num" aria-hidden="true">2</span>
            <p>{t('landing.step2')}</p>
            <span className="landing-step-icon" data-accent="blue" aria-hidden="true">
              <svg viewBox="0 0 32 32" fill="none">
                <defs>
                  <linearGradient id="lg-g-nocam" x1="6" y1="8" x2="26" y2="26">
                    <stop stopColor="#4f7cff"/><stop offset="1" stopColor="#22c8ee"/>
                  </linearGradient>
                </defs>
                <rect x="4.5" y="10" width="15" height="12" rx="3" fill="url(#lg-g-nocam)"/>
                <circle cx="12" cy="16" r="2.6" fill="#fff"/>
                <path d="M19.5 14.5 25 11v10l-5.5-3.5" stroke="url(#lg-g-nocam)" strokeWidth="2.2" strokeLinejoin="round" fill="none"/>
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
                  <linearGradient id="lg-g-eye" x1="5" y1="9" x2="27" y2="23">
                    <stop stopColor="#22c8ee"/><stop offset="1" stopColor="#8b5cf6"/>
                  </linearGradient>
                </defs>
                <path d="M3.5 16S8 8.5 16 8.5 28.5 16 28.5 16 24 23.5 16 23.5 3.5 16 3.5 16Z"
                      stroke="url(#lg-g-eye)" strokeWidth="2" fill="none" strokeLinejoin="round"/>
                <path d="M16 12.2a3.8 3.8 0 0 1 3.8 3.8c0 1.5-.9 2.8-2.2 3.4" stroke="url(#lg-g-eye)" strokeWidth="1.7" strokeLinecap="round" fill="none"/>
                <path d="M16 14.2a1.8 1.8 0 0 1 1.8 1.8" stroke="url(#lg-g-eye)" strokeWidth="1.7" strokeLinecap="round" fill="none"/>
                <circle cx="16" cy="16" r=".9" fill="url(#lg-g-eye)"/>
              </svg>
            </span>
          </li>
        </ol>
      </section>

      {/* ── 5. Social proof ── */}
      <div className="landing-proof">
        <span className="landing-proof-pill">
          <span className="landing-proof-icons" aria-hidden="true">
            <span className="landing-proof-people">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="8" r="3" fill="#fff"/>
                <path d="M3.5 19c.6-3 2.9-4.6 5.5-4.6s4.9 1.6 5.5 4.6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="17" cy="9" r="2.4" fill="#fff" fillOpacity=".75"/>
                <path d="M15.5 19c.3-2.4 1.9-3.8 4-4.1" stroke="#fff" strokeOpacity=".75" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </span>
            <span className="landing-proof-unipay">U</span>
          </span>
          <span>{t('landing.proof')}</span>
        </span>
      </div>

      {/* ── 6–7. CTAs ── */}
      <div className="landing-ctas">
        <button className="landing-btn landing-btn-primary" onClick={handleTryDemo} disabled={loading}>
          <span>{loading ? '…' : t('landing.ctaPrimary')}</span>
          {!loading && <span aria-hidden="true">→</span>}
        </button>
        <button className="landing-btn landing-btn-secondary" onClick={onShowHowItWorks}>
          <span>{t('landing.ctaSecondary')}</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>

      {/* ── Partner link ── */}
      <div className="landing-partner-link">
        <button onClick={onShowImplementation}>{t('landing.partnerLink')}</button>
      </div>

      {/* ── 8. Scroll indicator ── */}
      <div className="landing-scroll-hint" aria-hidden="true">
        <span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>
    </div>
  );
}
