/**
 * LandingHeader — shared header for landing-family screens
 * (landing, how-it-works, implementation).
 *
 * Shield-pulse LiveGuard logo + wordmark + theme toggle + FR/EN switch.
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { useI18n } from '../i18n/I18nContext';
import { useTheme } from '../hooks/useTheme';
import { LiveGuardLogo } from './LiveGuardLogo';

export function LandingHeader({ onLogoClick }: { onLogoClick?: () => void }) {
  const { locale, setLocale } = useI18n();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="landing-topbar">
      <div
        className={`landing-brand${onLogoClick ? ' landing-brand-clickable' : ''}`}
        onClick={onLogoClick}
        role={onLogoClick ? 'button' : undefined}
        tabIndex={onLogoClick ? 0 : undefined}
        aria-label={onLogoClick ? 'LiveGuard — home' : undefined}
      >
        <LiveGuardLogo size={38} />
        <span className="landing-brand-name">LiveGuard</span>
      </div>

      <div className="landing-header-actions">
        <button type="button" className="landing-theme-toggle" onClick={toggleTheme}
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
        <div className="landing-lang-switch" role="group" aria-label="Language">
          <button type="button" className={locale === 'fr' ? 'active' : ''}
                  onClick={() => setLocale('fr')}>FR</button>
          <button type="button" className={locale === 'en' ? 'active' : ''}
                  onClick={() => setLocale('en')}>EN</button>
        </div>
      </div>
    </header>
  );
}
