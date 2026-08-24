/**
 * LiveGuard — LandingScreen (unified home page at "/")
 *
 * Replaces the old ShowcaseScreen with the polished Kimi K3 landing design:
 * adaptive light/dark, hierarchical status accordion, radial gradient hero,
 * 3 numbered steps, UniPay social proof, partner link.
 *
 * Two CTAs:
 *   - "Essayer" → onTryDemo (resolves session, dispatches START → 5 cognitive tests)
 *   - "Comment ça fonctionne" → onShowHowItWorks (HowItWorksScreen)
 * Partner link → onShowImplementation (ImplementationScreen)
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { useState, useCallback } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { LandingHeader } from '../components/LandingHeader';
import { LiveGuardLogo } from '../components/LiveGuardLogo';
import { LIVEGUARD_SESSION_ENDPOINT } from '../liveguard/constants';
import { StatusSection, StatusSubRow, STATUS_ICONS as ICONS } from '../components/landingStatus';

interface Props {
  onTryDemo: (sessionPublicId: string) => void;
  onShowHowItWorks: () => void;
  onShowImplementation: () => void;
  onShowScenarios?: (sessionPublicId: string) => void;
}

export function LandingScreen({ onTryDemo, onShowHowItWorks, onShowImplementation, onShowScenarios }: Props) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleSection = useCallback((key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

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

  const handleShowScenarios = useCallback(async () => {
    setLoading(true);
    let id = await ensureSession();
    if (!id) {
      id = `lg_${Date.now().toString(36)}`;
    }
    setLoading(false);
    onShowScenarios?.(id);
  }, [ensureSession, onShowScenarios]);

  return (
    <div className="landing-page">
      {/* ── 1. Header ── */}
      <LandingHeader />

      {/* ── 2+3. Hero grid (hero title/CTA + shield visual with floating status) ── */}
      {/* On mobile: stacks vertically (status block, then hero).
          On desktop (min-width: 901px): 2-column grid, hero on left,
          shield image + floating status cards on right. */}
      <div className="landing-hero-grid">
        {/* ── Right column: shield image + floating status cards ── */}
        <div className="landing-hero-visual">
          {/* Shield image — single image (shield-hero-dark.png) used in
              both themes. In light mode, a dark vignette container behind
              the image provides contrast (see .landing-shield-vignette). */}
          <div className="landing-shield-vignette" aria-hidden="true" />
          <img
            className="landing-shield-img"
            src="/images/shield-hero-dark.png"
            alt=""
            aria-hidden="true"
          />

          {/* Protection status accordion — stacks on mobile, floats
              around the shield image on desktop. */}
          <section className="landing-status-block">
            <StatusSection
              icon={ICONS.brain}
              labelKey="landing.status.section.cognitive"
              descKey="landing.status.section.cognitive.desc"
              status="active"
              accent="cognitive"
              expanded={!!expanded.cognitive}
              onToggle={() => toggleSection('cognitive')}
            >
              <ul className="landing-status-list">
                <li>{t('landing.status.cognitive.stroop')}</li>
                <li>{t('landing.status.cognitive.nback')}</li>
                <li>{t('landing.status.cognitive.reflex')}</li>
                <li>{t('landing.status.cognitive.digitSpan')}</li>
                <li>{t('landing.status.cognitive.trailTap')}</li>
              </ul>
            </StatusSection>

            <StatusSection
              icon={ICONS.activity}
              labelKey="landing.status.section.behavioral"
              descKey="landing.status.section.behavioral.desc"
              status="active"
              accent="behavioral"
              partialBadge
              expanded={!!expanded.behavioral}
              onToggle={() => toggleSection('behavioral')}
            >
              <StatusSubRow icon={ICONS.keyboard} labelKey="landing.status.behavioral.keyboardMouse" status="active" />
              <StatusSubRow icon={ICONS.touch} labelKey="landing.status.behavioral.touch" status="observation" />
              <StatusSubRow icon={ICONS.sensors} labelKey="landing.status.behavioral.sensors" status="observation" />
            </StatusSection>

            <StatusSection
              icon={ICONS.wifi}
              labelKey="landing.status.section.network"
              descKey="landing.status.section.network.desc"
              status="active"
              accent="network"
              expanded={!!expanded.network}
              onToggle={() => toggleSection('network')}
            >
              <StatusSubRow icon={null} labelKey="landing.status.network.failedAuth" status="normal" />
              <StatusSubRow icon={null} labelKey="landing.status.network.highFrequency" status="normal" />
              <StatusSubRow icon={null} labelKey="landing.status.network.suspiciousPayload" status="normal" />
              <StatusSubRow icon={null} labelKey="landing.status.network.replayPattern" status="normal" />
            </StatusSection>
          </section>
        </div>

        {/* ── Left column: hero title + CTA ── */}
        <section className="landing-hero">
          <div className="landing-hero-content">
            <h1>{t('landing.heroTitle')}</h1>
            <p className="landing-lede">{t('landing.heroSub')}</p>
            {/* CTA "Voir la démo" — visible on desktop in the hero left column.
                Uses the same handleShowScenarios as the bottom CTA. */}
            {onShowScenarios && (
              <button
                className="landing-btn landing-btn-primary landing-hero-cta"
                onClick={handleShowScenarios}
                disabled={loading}
              >
                <span>{loading ? '…' : t('landing.heroCta')}</span>
                {!loading && <span aria-hidden="true">→</span>}
              </button>
            )}
            {/* Mini-stats row — 3 key facts under the CTA.
                Visible on both mobile and desktop. */}
            <div className="landing-hero-stats">
              <span className="landing-hero-stat">{t('landing.heroStats.exercises')}</span>
              <span className="landing-hero-stat-sep" aria-hidden="true">·</span>
              <span className="landing-hero-stat">{t('landing.heroStats.patents')}</span>
              <span className="landing-hero-stat-sep" aria-hidden="true">·</span>
              <span className="landing-hero-stat">{t('landing.heroStats.privacy')}</span>
            </div>
          </div>
        </section>
      </div>

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

      {/* ── 4b. How it works (desktop only, hidden on mobile) ── */}
      <section className="landing-howitworks" aria-label={t('landing.howItWorks.label')}>
        <span className="landing-howitworks-label">{t('landing.howItWorks.label')}</span>
        <div className="landing-howitworks-grid">
          <div className="landing-howitworks-card" data-accent="indigo">
            <span className="landing-howitworks-icon" data-accent="indigo" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M7 12h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </span>
            <h3>{t('landing.howItWorks.card1.title')}</h3>
            <p>{t('landing.howItWorks.card1.text')}</p>
          </div>
          <div className="landing-howitworks-card" data-accent="violet">
            <span className="landing-howitworks-icon" data-accent="violet" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </span>
            <h3>{t('landing.howItWorks.card2.title')}</h3>
            <p>{t('landing.howItWorks.card2.text')}</p>
          </div>
          <div className="landing-howitworks-card" data-accent="coral">
            <span className="landing-howitworks-icon" data-accent="coral" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                <rect x="3" y="11" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </span>
            <h3>{t('landing.howItWorks.card3.title')}</h3>
            <p>{t('landing.howItWorks.card3.text')}</p>
          </div>
        </div>
      </section>

      {/* ── 4c. Domain protection (HCS-U7, desktop only) ── */}
      <section className="landing-domain" aria-label={t('landing.domain.title')}>
        <div className="landing-domain-content">
          <span className="landing-domain-badge">{t('landing.domain.badge')}</span>
          <h2>{t('landing.domain.title')}</h2>
          <p>{t('landing.domain.text')}</p>
          <a
            className="landing-btn landing-btn-primary landing-domain-cta"
            href="https://hcs-u7.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>{t('landing.domain.cta')}</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="landing-domain-terminal" aria-hidden="true">
          <div className="landing-domain-terminal-line">{t('landing.domain.terminal.line1')}</div>
          <div className="landing-domain-terminal-line">{t('landing.domain.terminal.line2')}</div>
          <div className="landing-domain-terminal-line landing-domain-terminal-success">
            {t('landing.domain.terminal.line3')}
          </div>
        </div>
      </section>

      {/* ── 4d. Footer (desktop only) ── */}
      <footer className="landing-footer">
        <span className="landing-footer-copyright">
          {t('landing.footer.copyright')}{' '}
          <a href="https://ia-solution.fr" target="_blank" rel="noopener noreferrer">
            {t('landing.footer.company')}
          </a>
        </span>
        <nav className="landing-footer-links">
          <a href="https://ia-solution.fr" target="_blank" rel="noopener noreferrer">
            {t('landing.footer.docs')}
          </a>
          <a href="https://ia-solution.fr" target="_blank" rel="noopener noreferrer">
            {t('landing.footer.integration')}
          </a>
          <a href="https://ia-solution.fr" target="_blank" rel="noopener noreferrer">
            {t('landing.footer.contact')}
          </a>
        </nav>
      </footer>

      {/* ── 5. Social proof ── */}
      <div className="landing-proof">
        <span className="landing-proof-pill">
          <span className="landing-proof-icons" aria-hidden="true">
            <span className="landing-proof-people">
              <LiveGuardLogo size={16} />
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
        {onShowScenarios && (
          <button className="landing-btn landing-btn-secondary" onClick={handleShowScenarios} disabled={loading}>
            <span>{loading ? '…' : t('landing.scenariosCta')}</span>
            {!loading && <span aria-hidden="true">→</span>}
          </button>
        )}
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
