/**
 * LiveGuard — IntegrationScreen ("Comment ça s'intègre")
 *
 * Explains the embedded SDK model to potential partners (banks, fintechs).
 * Cites the UniPay production proof. Shows a mockup of SelectProtectionScreen
 * as an illustration of the end-user experience once integrated.
 *
 * Honest: only claims what is actually built (embedded SDK on UniPay).
 * Does NOT claim automatic third-party app detection.
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { useI18n } from '../i18n/I18nContext';
import { useTheme } from '../hooks/useTheme';
import { LanguagePill } from '../components/LanguagePill';

interface Props {
  onBack: () => void;
  onTryDemo: (sessionPublicId: string) => void;
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden width="20" height="20">
      <path d="M19 12 H5 M11 6 L5 12 L11 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden width="16" height="16">
      <path d="M5 12 L10 17 L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StepIcon({ n }: { n: number }) {
  return (
    <div className="integration-step-num">{n}</div>
  );
}

export function IntegrationScreen({ onBack }: Props) {
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();

  const steps = [
    t('integration.step1'),
    t('integration.step2'),
    t('integration.step3'),
    t('integration.step4'),
  ];

  const options = [
    { label: t('integration.optionSdk'), available: true },
    { label: t('integration.optionIframe'), available: false },
    { label: t('integration.optionCustom'), available: false },
  ];

  return (
    <div className="screen integration-screen">
      <div className="integration-top-actions">
        <LanguagePill />
        <button type="button" className="integration-theme-toggle" onClick={toggleTheme}
                aria-label={t('integration.back') === 'Retour' ? 'Basculer le thème' : 'Toggle theme'}>
          {theme === 'light' ? (
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="18" height="18">
              <path d="M20.4 14.2A8.5 8.5 0 0 1 9.8 3.6a8.5 8.5 0 1 0 10.6 10.6Z"
                    stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="18" height="18">
              <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>

      <button className="btn-back" onClick={onBack}>
        <ArrowLeftIcon />
        {t('integration.back')}
      </button>

      <h1 className="title-lg" style={{ marginTop: 16, marginBottom: 8 }}>
        {t('integration.title')}
      </h1>
      <p className="subtitle" style={{ marginBottom: 24 }}>
        {t('integration.subtitle')}
      </p>

      {/* ─── SDK-embedded model explanation ─── */}
      <div className="integration-section">
        <h2 className="integration-section-title">
          {t('integration.modelTitle')}
        </h2>
        <p className="integration-section-text">
          {t('integration.modelText')}
        </p>
      </div>

      {/* ─── Production proof ─── */}
      <div className="integration-section integration-proof">
        <h2 className="integration-section-title">
          {t('integration.proofTitle')}
        </h2>
        <p className="integration-section-text">
          {t('integration.proofText')}
        </p>
        <div className="integration-proof-badge">
          <CheckIcon />
          <span>{t('integration.proofBadge')}</span>
        </div>
      </div>

      {/* ─── How it works (4 steps) ─── */}
      <div className="integration-section">
        <h2 className="integration-section-title">
          {t('integration.howTitle')}
        </h2>
        <div className="integration-steps">
          {steps.map((step, i) => (
            <div className="integration-step" key={i}>
              <StepIcon n={i + 1} />
              <p className="integration-step-text">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── UX mockup (SelectProtectionScreen illustration) ─── */}
      <div className="integration-section">
        <h2 className="integration-section-title">
          {t('integration.uxTitle')}
        </h2>
        <p className="integration-section-text">
          {t('integration.uxText')}
        </p>
        <div className="integration-mockup">
          <div className="integration-mockup-label">
            {t('integration.mockupLabel')}
          </div>
          <div className="integration-mockup-screen">
            <div className="integration-mockup-title">
              {t('protection.title')}
            </div>
            <div className="integration-mockup-subtitle">
              {t('protection.subtitle')}
            </div>
            <div className="integration-mockup-cards">
              <div className="integration-mockup-card integration-mockup-card--selected">
                <span>🏦</span>
                <span>{t('protection.banking')}</span>
              </div>
              <div className="integration-mockup-card">
                <span>₿</span>
                <span>{t('protection.crypto')}</span>
              </div>
            </div>
            <div className="integration-mockup-btn">
              {t('protection.start')}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Integration options ─── */}
      <div className="integration-section">
        <h2 className="integration-section-title">
          {t('integration.optionsTitle')}
        </h2>
        <div className="integration-options">
          {options.map((opt, i) => (
            <div
              className={`integration-option ${opt.available ? 'integration-option--available' : 'integration-option--todo'}`}
              key={i}
            >
              <span className="integration-option-label">{opt.label}</span>
              <span className="integration-option-status">
                {opt.available ? t('integration.available') : t('integration.toExplore')}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button className="btn-primary integration-back-cta" onClick={onBack}>
        {t('integration.backToShowcase')}
      </button>
    </div>
  );
}
