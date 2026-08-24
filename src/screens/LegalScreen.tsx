/**
 * LiveGuard — LegalScreen (responsive, mobile + desktop)
 *
 * Renders legal documents (Terms, Privacy, Cookies) in the site's
 * visual language. Uses LandingHeader for the top bar (logo, theme
 * toggle, locale switch) and a simple responsive content layout.
 *
 * Content is loaded from legalContent.ts (structured data, FR + EN)
 * based on the active locale — no markdown parser needed.
 *
 * A single responsive component (no desktop/mobile split) since these
 * are text content pages, not interactive screens.
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { useI18n } from '../i18n/I18nContext';
import { useTheme } from '../hooks/useTheme';
import { LandingHeader } from '../components/LandingHeader';
import { LiveGuardLogo } from '../components/LiveGuardLogo';
import { getLegalDocument, type LegalSection } from './legalContent';
import '../styles/legal.css';

interface Props {
  section: LegalSection;
  onBackToLanding: () => void;
}

export function LegalScreen({ section, onBackToLanding }: Props) {
  const { t, locale } = useI18n();
  const { theme } = useTheme();
  const doc = getLegalDocument(section, locale);

  const sectionLabels: Record<LegalSection, { fr: string; en: string }> = {
    terms: { fr: 'Conditions d\u2019utilisation', en: 'Terms of Use' },
    privacy: { fr: 'Politique de confidentialité', en: 'Privacy Policy' },
    cookies: { fr: 'Politique de cookies', en: 'Cookie Policy' },
  };

  const navLinks: { section: LegalSection; label: string; active: boolean }[] = [
    { section: 'terms', label: sectionLabels.terms[locale], active: section === 'terms' },
    { section: 'privacy', label: sectionLabels.privacy[locale], active: section === 'privacy' },
    { section: 'cookies', label: sectionLabels.cookies[locale], active: section === 'cookies' },
  ];

  return (
    <div className="legal-page" data-theme={theme}>
      <LandingHeader onLogoClick={onBackToLanding} />

      <div className="legal-container">
        {/* Back link */}
        <button type="button" className="legal-back" onClick={onBackToLanding}>
          <span aria-hidden="true">←</span>
          <span>{locale === 'fr' ? 'Retour à l\u2019accueil' : 'Back to home'}</span>
        </button>

        {/* Section navigation tabs */}
        <nav className="legal-nav">
          {navLinks.map((link) => (
            <span key={link.section} className={`legal-nav-item${link.active ? ' legal-nav-active' : ''}`}>
              {link.label}
            </span>
          ))}
        </nav>

        {/* Document title */}
        <h1 className="legal-title">{doc.title}</h1>

        {/* Publisher meta */}
        <div className="legal-meta">
          <p><strong>{locale === 'fr' ? 'Éditeur' : 'Publisher'} :</strong> {doc.meta.publisher}</p>
          <p><strong>{locale === 'fr' ? 'Contact' : 'Contact'} :</strong> {doc.meta.contact}</p>
          <p><strong>{locale === 'fr' ? 'Dernière mise à jour' : 'Last updated'} :</strong> {doc.meta.lastUpdated}</p>
        </div>

        {/* Document content */}
        <article className="legal-content">
          {doc.blocks.map((block, i) => (
            <section key={i} className="legal-block">
              {block.heading && <h2 className="legal-heading">{block.heading}</h2>}
              {block.lead && <p className="legal-lead">{block.lead}</p>}
              {block.paragraphs?.map((p, j) => (
                <p key={j} className="legal-paragraph">{p}</p>
              ))}
              {block.list && (
                <ul className="legal-list">
                  {block.list.map((item, k) => (
                    <li key={k}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>
      </div>

      {/* Footer (simplified, same style as desktop) */}
      <footer className="legal-footer">
        <div className="legal-footer-inner">
          <span className="legal-footer-copyright">
            <span className="legal-footer-logo" aria-hidden="true">
              <LiveGuardLogo size={16} />
            </span>
            © 2026 IA Solution — {t('landing.footer.copyright')}
          </span>
          <nav className="legal-footer-links">
            {navLinks.map((link) => (
              <span key={link.section} className={link.active ? 'legal-footer-link-active' : ''}>
                {link.label}
              </span>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
