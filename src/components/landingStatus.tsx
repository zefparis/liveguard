/**
 * Shared landing status sub-components.
 *
 * StatusBadge, StatusSection, StatusSubRow, and ICONS are used by both
 * the mobile LandingScreen and the desktop LandingScreenDesktop. They
 * contain the business logic (status kinds, accent colors, badges,
 * expand/collapse) but are presentation-agnostic — styling comes from
 * the CSS classes which are scoped separately in each screen's CSS.
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { type ReactNode } from 'react';
import { useI18n } from '../i18n/I18nContext';

export type StatusKind = 'active' | 'observation' | 'normal';
export type StatusAccent = 'cognitive' | 'behavioral' | 'network';

export interface StatusSubItem {
  icon: ReactNode;
  labelKey: string;
  status: StatusKind;
}

export interface StatusSectionProps {
  icon: ReactNode;
  labelKey: string;
  descKey: string;
  status: StatusKind;
  accent: StatusAccent;
  partialBadge?: boolean;
  expanded: boolean;
  onToggle: () => void;
  children?: ReactNode;
}

export function StatusBadge({ status, partial }: { status: StatusKind; partial?: boolean }) {
  const { t } = useI18n();
  if (partial) {
    return (
      <span className="landing-status-badge landing-status-badge-active">
        <span className="landing-status-dot" aria-hidden="true" />
        {t('landing.status.activePartial')}
      </span>
    );
  }
  return (
    <span className={`landing-status-badge landing-status-badge-${status}`}>
      {t(`landing.status.${status}`)}
    </span>
  );
}

export function StatusSection({ icon, labelKey, descKey, status, accent, partialBadge, expanded, onToggle, children }: StatusSectionProps) {
  const { t } = useI18n();
  return (
    <div className="landing-status-section" data-accent={accent}>
      <button
        type="button"
        className="landing-status-row"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <span className="landing-status-icon" aria-hidden="true">{icon}</span>
        <span className="landing-status-heading">
          <span className="landing-status-label">{t(labelKey)}</span>
          <span className="landing-status-desc">{t(descKey)}</span>
        </span>
        <StatusBadge status={status} partial={partialBadge} />
        <svg
          className={`landing-status-chevron${expanded ? ' is-open' : ''}`}
          width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {expanded && <div className="landing-status-content">{children}</div>}
    </div>
  );
}

export function StatusSubRow({ icon, labelKey, status }: StatusSubItem) {
  const { t } = useI18n();
  return (
    <div className="landing-status-subrow">
      {icon && <span className="landing-status-icon" aria-hidden="true">{icon}</span>}
      <span className="landing-status-label">{t(labelKey)}</span>
      <StatusBadge status={status} />
    </div>
  );
}

export const STATUS_ICONS = {
  brain: (
    <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
      <path d="M9.5 4.5A2.5 2.5 0 0 0 7 7c-1.7.3-3 1.8-3 3.5 0 1.2.6 2.2 1.5 2.8A3.5 3.5 0 0 0 5 16.5c0 1.9 1.6 3.5 3.5 3.5.7 0 1.4-.2 1.9-.6.3 1.1 1.3 1.9 2.6 1.9V4.5h-3.5Z" fill="currentColor" fillOpacity=".2"/>
      <path d="M12 4.5v16.8c1.3 0 2.3-.8 2.6-1.9.5.4 1.2.6 1.9.6 1.9 0 3.5-1.6 3.5-3.5 0-1.2-.6-2.2-1.5-2.8.9-.6 1.5-1.6 1.5-2.8 0-1.7-1.3-3.2-3-3.5a2.5 2.5 0 0 0-2.5-2.5H12Z" fill="currentColor" fillOpacity=".2"/>
      <path d="M12 4.5v16.8M9.5 4.5A2.5 2.5 0 0 0 7 7c-1.7.3-3 1.8-3 3.5 0 1.2.6 2.2 1.5 2.8A3.5 3.5 0 0 0 5 16.5c0 1.9 1.6 3.5 3.5 3.5.7 0 1.4-.2 1.9-.6.3 1.1 1.3 1.9 2.6 1.9m1.5-16.8h1.5A2.5 2.5 0 0 1 19 7c1.7.3 3 1.8 3 3.5 0 1.2-.6 2.2-1.5 2.8.9.6 1.5 1.6 1.5 2.8 0 1.9-1.6 3.5-3.5 3.5-.7 0-1.4-.2-1.9-.6-.3 1.1-1.3 1.9-2.6 1.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  activity: (
    <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
      <path d="M3 12h4l2-7 4 14 2-7h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  wifi: (
    <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
      <path d="M5 10.5C8 7.5 16 7.5 19 10.5M7.5 13.7c2-2 7-2 9 0M10 17c1-1 3-1 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="12" cy="19.5" r="1.3" fill="currentColor"/>
    </svg>
  ),
  keyboard: (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
      <rect x="2.5" y="6" width="19" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M9 14h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  touch: (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
      <path d="M9 11V5a2 2 0 1 1 4 0v6m0-2a2 2 0 1 1 4 0v3a7 7 0 0 1-7 7h-1a7 7 0 0 1-7-7v-1a2 2 0 1 1 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  sensors: (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 2v3m0 14v3M2 12h3m14 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
};
