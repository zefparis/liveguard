/**
 * LiveGuard — ImplementationScreen (partner/business audience)
 *
 * Deliberately vague on technical integration details — no pricing,
 * no plan comparison, no SDK/iframe/custom menu. Single goal:
 * get them to email.
 *
 * Tone: confident, benefit-oriented, warm.
 *
 * Single CTA: mailto:contact@ia-solution.fr
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { useI18n } from '../i18n/I18nContext';
import { LandingHeader } from '../components/LandingHeader';
import { LiveGuardLogo } from '../components/LiveGuardLogo';

interface Props {
  onBack: () => void;
  onBackToLanding: () => void;
}

function InvisibleIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="imp-g-invisible" x1="6" y1="6" x2="26" y2="26">
          <stop stopColor="#8b5cf6"/><stop offset="1" stopColor="#22c8ee"/>
        </linearGradient>
      </defs>
      <path d="M3.5 16S8 8.5 16 8.5 28.5 16 28.5 16 24 23.5 16 23.5 3.5 16 3.5 16Z"
            stroke="url(#imp-g-invisible)" strokeWidth="1.8" fill="none" strokeLinejoin="round"
            strokeDasharray="3 3"/>
      <circle cx="16" cy="16" r="3.5" stroke="url(#imp-g-invisible)" strokeWidth="1.8" fill="none"/>
    </svg>
  );
}

function NoInstallIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="imp-g-noinstall" x1="6" y1="6" x2="26" y2="26">
          <stop stopColor="#4f7cff"/><stop offset="1" stopColor="#22c8ee"/>
        </linearGradient>
      </defs>
      <rect x="7" y="4" width="18" height="24" rx="3.5" stroke="url(#imp-g-noinstall)" strokeWidth="1.8" fill="none"/>
      <path d="M13 8h6" stroke="url(#imp-g-noinstall)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M16 14v8M16 14l-3 3M16 14l3 3" stroke="url(#imp-g-noinstall)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="16" cy="24" r="1.2" fill="url(#imp-g-noinstall)"/>
    </svg>
  );
}

function ShieldPatternIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="imp-g-shield" x1="6" y1="6" x2="26" y2="26">
          <stop stopColor="#22c8ee"/><stop offset="1" stopColor="#8b5cf6"/>
        </linearGradient>
      </defs>
      <path d="M16 3.5 5.5 7.2v7c0 6.2 4.4 12 10.5 14.3C22.1 26.2 26.5 20.4 26.5 14.2v-7L16 3.5Z"
            stroke="url(#imp-g-shield)" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
      <path d="M12 13.5c1-1.2 2.5-1.2 4 0s3 1.2 4 0" stroke="url(#imp-g-shield)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M12 17c1-1.2 2.5-1.2 4 0s3 1.2 4 0" stroke="url(#imp-g-shield)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M12 20.5c1-1.2 2.5-1.2 4 0s3 1.2 4 0" stroke="url(#imp-g-shield)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

export function ImplementationScreen({ onBack, onBackToLanding }: Props) {
  const { t } = useI18n();

  const benefits = [
    {
      icon: <InvisibleIcon />,
      title: t('implementation.benefit1Title'),
      text: t('implementation.benefit1Text'),
      accent: 'violet',
    },
    {
      icon: <NoInstallIcon />,
      title: t('implementation.benefit2Title'),
      text: t('implementation.benefit2Text'),
      accent: 'blue',
    },
    {
      icon: <ShieldPatternIcon />,
      title: t('implementation.benefit3Title'),
      text: t('implementation.benefit3Text'),
      accent: 'cyan',
    },
  ];

  return (
    <div className="landing-page imp-page">
      <LandingHeader onLogoClick={onBackToLanding} />

      {/* ── Back link ── */}
      <button className="imp-back" onClick={onBack}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="20" height="20">
          <path d="M19 12 H5 M11 6 L5 12 L11 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {t('implementation.back')}
      </button>

      {/* ── Headline ── */}
      <section className="imp-hero">
        <h1 className="imp-title">{t('implementation.title')}</h1>
      </section>

      {/* ── Proof section (green gradient pill, prominent) ── */}
      <div className="landing-proof imp-proof">
        <span className="landing-proof-pill">
          <span className="landing-proof-icons" aria-hidden="true">
            <span className="landing-proof-people">
              <LiveGuardLogo size={16} />
            </span>
            <span className="landing-proof-unipay">U</span>
          </span>
          <span>{t('implementation.proof')}</span>
        </span>
      </div>

      {/* ── 3 benefit cards ── */}
      <section className="imp-benefits">
        {benefits.map((b, i) => (
          <div className="imp-benefit-card" data-accent={b.accent} key={i}>
            <div className="imp-benefit-icon" data-accent={b.accent} aria-hidden="true">
              {b.icon}
            </div>
            <div className="imp-benefit-content">
              <h3 className="imp-benefit-title">{b.title}</h3>
              <p className="imp-benefit-text">{b.text}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Deliberately vague technical line ── */}
      <p className="imp-tech-line">{t('implementation.techLine')}</p>

      {/* ── Single CTA ── */}
      <div className="landing-ctas">
        <a className="landing-btn landing-btn-primary imp-cta"
           href="mailto:contact@ia-solution.fr">
          <span>{t('implementation.cta')}</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  );
}
