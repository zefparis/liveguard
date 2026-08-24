/**
 * LandingScreenDesktop — separate desktop landing page.
 *
 * Has its own CSS (landing-desktop.css) with a desktop-first typography
 * scale, independent of the mobile LandingScreen. Shares business logic
 * (status cards, session resolution, i18n) via imported sub-components.
 *
 * Typography scale (desktop-native, NOT derived from mobile clamp()):
 *   - H1 hero: 56-64px
 *   - Brand wordmark: 22-24px
 *   - Body/paragraph: 17-18px
 *   - Spacing: generous, designed for wide screens from the start
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { useState, useCallback } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { LiveGuardLogo } from '../components/LiveGuardLogo';
import { useTheme } from '../hooks/useTheme';
import { LIVEGUARD_SESSION_ENDPOINT } from '../liveguard/constants';
import { StatusSection, StatusSubRow, STATUS_ICONS as ICONS } from '../components/landingStatus';
import '../styles/landing-desktop.css';

interface Props {
  onTryDemo: (sessionPublicId: string) => void;
  onShowHowItWorks: () => void;
  onShowImplementation: () => void;
  onShowScenarios?: (sessionPublicId: string) => void;
}

export function LandingScreenDesktop({ onTryDemo, onShowHowItWorks, onShowImplementation, onShowScenarios }: Props) {
  const { t, locale, setLocale } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleSection = useCallback((key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

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
      if (data.sessionPublicId && /^hcs_sess_[A-Za-z0-9_-]+$/.test(data.sessionPublicId)) {
        return data.sessionPublicId;
      }
      return '';
    } catch {
      return '';
    }
  }, []);

  const handleTryDemo = useCallback(async () => {
    setLoading(true);
    let id = await ensureSession();
    if (!id) id = `lg_${Date.now().toString(36)}`;
    setLoading(false);
    onTryDemo(id);
  }, [ensureSession, onTryDemo]);

  const handleShowScenarios = useCallback(async () => {
    setLoading(true);
    let id = await ensureSession();
    if (!id) id = `lg_${Date.now().toString(36)}`;
    setLoading(false);
    onShowScenarios?.(id);
  }, [ensureSession, onShowScenarios]);

  return (
    <div className="ld-page">
      {/* ── Header ── */}
      <header className="ld-topbar">
        <div className="ld-brand">
          <LiveGuardLogo size={42} />
          <span className="ld-brand-name">LiveGuard</span>
        </div>
        <div className="ld-header-actions">
          <button type="button" className="ld-theme-toggle" onClick={toggleTheme}
                  aria-label={locale === 'fr' ? 'Basculer le thème' : 'Toggle theme'}>
            {theme === 'light' ? (
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M20.4 14.2A8.5 8.5 0 0 1 9.8 3.6a8.5 8.5 0 1 0 10.6 10.6Z"
                      stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            )}
          </button>
          <div className="ld-lang-switch" role="group" aria-label="Language">
            <button type="button" className={locale === 'fr' ? 'active' : ''}
                    onClick={() => setLocale('fr')}>FR</button>
            <button type="button" className={locale === 'en' ? 'active' : ''}
                    onClick={() => setLocale('en')}>EN</button>
          </div>
        </div>
      </header>

      {/* ── Hero: full-width banner with overlaid text ── */}
      <section className="ld-hero-banner" data-theme={theme}>
        <div className="ld-hero-banner-overlay" aria-hidden="true" />
        <div className="ld-hero-banner-content">
          <h1>{t('landing.heroTitle')}</h1>
          <p className="ld-lede">{t('landing.heroSub')}</p>
          {onShowScenarios && (
            <button className="ld-btn ld-btn-primary ld-hero-cta"
                    onClick={handleShowScenarios} disabled={loading}>
              <span>{loading ? '…' : t('landing.heroCta')}</span>
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          )}
          <div className="ld-hero-stats">
            <span>{t('landing.heroStats.exercises')}</span>
            <span aria-hidden="true">·</span>
            <span>{t('landing.heroStats.patents')}</span>
            <span aria-hidden="true">·</span>
            <span>{t('landing.heroStats.privacy')}</span>
          </div>
        </div>
      </section>

      {/* ── Status cards: 3-column horizontal row below the banner ── */}
      <section className="ld-status-row">
        <div className="ld-status-card-wrap" data-accent="cognitive">
          <span className="ld-status-count" aria-hidden="true">5</span>
          <StatusSection
            icon={ICONS.brain}
            labelKey="landing.status.section.cognitive"
            descKey="landing.status.section.cognitive.desc"
            status="active" accent="cognitive"
            expanded={!!expanded.cognitive}
            onToggle={() => toggleSection('cognitive')}
          >
            <ul className="ld-status-list">
              <li>{t('landing.status.cognitive.stroop')}</li>
              <li>{t('landing.status.cognitive.nback')}</li>
              <li>{t('landing.status.cognitive.reflex')}</li>
              <li>{t('landing.status.cognitive.digitSpan')}</li>
              <li>{t('landing.status.cognitive.trailTap')}</li>
            </ul>
          </StatusSection>
        </div>
        <div className="ld-status-card-wrap" data-accent="behavioral">
          <span className="ld-status-count" aria-hidden="true">3</span>
          <StatusSection
            icon={ICONS.activity}
            labelKey="landing.status.section.behavioral"
            descKey="landing.status.section.behavioral.desc"
            status="active" accent="behavioral" partialBadge
            expanded={!!expanded.behavioral}
            onToggle={() => toggleSection('behavioral')}
          >
            <StatusSubRow icon={ICONS.keyboard} labelKey="landing.status.behavioral.keyboardMouse" status="active" />
            <StatusSubRow icon={ICONS.touch} labelKey="landing.status.behavioral.touch" status="observation" />
            <StatusSubRow icon={ICONS.sensors} labelKey="landing.status.behavioral.sensors" status="observation" />
          </StatusSection>
        </div>
        <div className="ld-status-card-wrap" data-accent="network">
          <span className="ld-status-count" aria-hidden="true">4</span>
          <StatusSection
            icon={ICONS.wifi}
            labelKey="landing.status.section.network"
            descKey="landing.status.section.network.desc"
            status="active" accent="network"
            expanded={!!expanded.network}
            onToggle={() => toggleSection('network')}
          >
            <StatusSubRow icon={null} labelKey="landing.status.network.failedAuth" status="normal" />
            <StatusSubRow icon={null} labelKey="landing.status.network.highFrequency" status="normal" />
            <StatusSubRow icon={null} labelKey="landing.status.network.suspiciousPayload" status="normal" />
            <StatusSubRow icon={null} labelKey="landing.status.network.replayPattern" status="normal" />
          </StatusSection>
        </div>
      </section>

      {/* ── Three steps — premium image-background cards ── */}
      <section className="ld-steps" id="steps">
        <ol className="ld-step-list">
          <li className="ld-step-card" data-accent="violet">
            <span className="ld-step-num">1</span>
            <div className="ld-step-title-zone">
              <h3 className="ld-step-title">{t('landing.desktop.step1.title')}</h3>
            </div>
            <p className="ld-step-desc">{t('landing.step1')}</p>
          </li>
          <li className="ld-step-card" data-accent="blue">
            <span className="ld-step-num">2</span>
            <div className="ld-step-title-zone">
              <h3 className="ld-step-title">{t('landing.desktop.step2.title')}</h3>
            </div>
            <p className="ld-step-desc">{t('landing.step2')}</p>
          </li>
          <li className="ld-step-card" data-accent="teal">
            <span className="ld-step-num">3</span>
            <div className="ld-step-title-zone">
              <h3 className="ld-step-title">{t('landing.desktop.step3.title')}</h3>
            </div>
            <p className="ld-step-desc">{t('landing.step3')}</p>
          </li>
        </ol>
      </section>

      {/* ── How it works ── */}
      <section className="ld-howitworks">
        <span className="ld-howitworks-label">{t('landing.howItWorks.label')}</span>
        <div className="ld-howitworks-grid">
          <div className="ld-howitworks-card" data-accent="indigo">
            <h3>{t('landing.howItWorks.card1.title')}</h3>
            <p>{t('landing.howItWorks.card1.text')}</p>
          </div>
          <div className="ld-howitworks-card" data-accent="violet">
            <h3>{t('landing.howItWorks.card2.title')}</h3>
            <p>{t('landing.howItWorks.card2.text')}</p>
          </div>
          <div className="ld-howitworks-card" data-accent="coral">
            <h3>{t('landing.howItWorks.card3.title')}</h3>
            <p>{t('landing.howItWorks.card3.text')}</p>
          </div>
        </div>
      </section>

      {/* ── Domain protection (HCS-U7) ── */}
      <section className="ld-domain">
        <div className="ld-domain-content">
          <span className="ld-domain-badge">{t('landing.domain.badge')}</span>
          <h2>{t('landing.domain.title')}</h2>
          <p>{t('landing.domain.text')}</p>
          <a className="ld-btn ld-btn-primary ld-domain-cta"
             href="https://hcs-u7.com" target="_blank" rel="noopener noreferrer">
            <span>{t('landing.domain.cta')}</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="ld-domain-terminal" aria-hidden="true">
          <div className="ld-domain-terminal-line">{t('landing.domain.terminal.line1')}</div>
          <div className="ld-domain-terminal-line">{t('landing.domain.terminal.line2')}</div>
          <div className="ld-domain-terminal-line ld-domain-terminal-success">
            {t('landing.domain.terminal.line3')}
          </div>
        </div>
      </section>

      {/* ── Final CTA section (before footer) ── */}
      <section className="ld-final-cta">
        <div className="ld-ctas">
          <button className="ld-btn ld-btn-primary" onClick={handleTryDemo} disabled={loading}>
            <span>{loading ? '…' : t('landing.ctaPrimary')}</span>
            {!loading && <span aria-hidden="true">→</span>}
          </button>
          <button className="ld-btn ld-btn-secondary" onClick={onShowHowItWorks}>
            <span>{t('landing.ctaSecondary')}</span>
            <span aria-hidden="true">→</span>
          </button>
          {onShowScenarios && (
            <button className="ld-btn ld-btn-secondary" onClick={handleShowScenarios} disabled={loading}>
              <span>{loading ? '…' : t('landing.scenariosCta')}</span>
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          )}
        </div>

        {/* ── Partner link ── */}
        <div className="ld-partner-link">
          <button onClick={onShowImplementation}>{t('landing.partnerLink')}</button>
        </div>

        {/* ── Social proof ── */}
        <div className="ld-proof">
          <span className="ld-proof-pill">
            <span className="ld-proof-icons" aria-hidden="true">
              <span className="ld-proof-people"><LiveGuardLogo size={18} /></span>
              <span className="ld-proof-unipay">U</span>
            </span>
            <span>{t('landing.proof')}</span>
          </span>
        </div>
      </section>

      {/* ── Multi-column footer ── */}
      <footer className="ld-footer">
        <div className="ld-footer-grid">
          <div className="ld-footer-col">
            <span className="ld-footer-col-title">{locale === 'fr' ? 'Produit' : 'Product'}</span>
            <a href="#how-it-works" onClick={(e) => { e.preventDefault(); onShowHowItWorks(); }}>{t('landing.ctaSecondary')}</a>
            {onShowScenarios && (
              <a href="#scenarios" onClick={(e) => { e.preventDefault(); handleShowScenarios(); }}>{t('landing.scenariosCta')}</a>
            )}
            <a href="https://hcs-u7.com" target="_blank" rel="noopener noreferrer">{t('landing.domain.cta')}</a>
          </div>
          <div className="ld-footer-col">
            <span className="ld-footer-col-title">{locale === 'fr' ? 'Légal' : 'Legal'}</span>
            <a href="/legal/terms">{locale === 'fr' ? "Conditions d'utilisation" : 'Terms of use'}</a>
            <a href="/legal/privacy">{locale === 'fr' ? 'Politique de confidentialité' : 'Privacy policy'}</a>
            <a href="/legal/cookies">{locale === 'fr' ? 'Politique de cookies' : 'Cookie policy'}</a>
          </div>
          <div className="ld-footer-col">
            <span className="ld-footer-col-title">{locale === 'fr' ? 'Société' : 'Company'}</span>
            <a href="https://ia-solution.fr" target="_blank" rel="noopener noreferrer">{t('landing.footer.company')}</a>
            <a href="https://ia-solution.fr" target="_blank" rel="noopener noreferrer">{t('landing.footer.contact')}</a>
          </div>
        </div>
        <div className="ld-footer-bottom">
          <span className="ld-footer-copyright">
            {t('landing.footer.copyright')}{' '}
            <a href="https://ia-solution.fr" target="_blank" rel="noopener noreferrer">
              {t('landing.footer.company')}
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
