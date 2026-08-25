/**
 * LiveGuard — Scenario Selector Screen (DESKTOP version)
 *
 * Desktop-native layout for the scenario selector: a 3-column grid of
 * scenario cards (2 rows for 6 scenarios). Clicking a card opens a
 * centered modal overlay containing the ScenarioDemoContent — the grid
 * itself is never unmounted, so there is no scroll-position loss or
 * remount bug.
 *
 * Reuses the exact same SCENARIOS data and ScenarioDemoContent component
 * as the mobile ScenarioSelectorScreen — no business logic duplication.
 *
 * Routed via useDesktop() in App.tsx (same pattern as LandingScreenDesktop).
 * Mobile (sub-900px) always uses ScenarioSelectorScreen.tsx, which is
 * never modified by this desktop variant.
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { useState, useCallback, useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { useTheme } from '../hooks/useTheme';
import { ScenarioDemoContent, SCENARIOS } from './ScenarioDemoContent';
import type { SuspensionData } from '../liveguard/behavior/telemetryTypes';
import '../styles/scenario-desktop.css';

interface Props {
  sessionPublicId: string;
  onSuspended: (data: SuspensionData) => void;
  onBack: () => void;
}

export function ScenarioSelectorScreenDesktop({ sessionPublicId, onSuspended, onBack }: Props) {
  const { t } = useI18n();
  const { theme } = useTheme();
  const [openId, setOpenId] = useState<number | null>(null);
  const [simulationActive, setSimulationActive] = useState(false);

  const handleClose = useCallback(() => {
    // Block backdrop/escape close while simulation is active — only the
    // explicit ✕ button can close during that phase.
    if (simulationActive) return;
    setOpenId(null);
  }, [simulationActive]);

  // Explicit close (✕ button) — always allowed, even during simulation
  const handleForceClose = useCallback(() => {
    setSimulationActive(false);
    setOpenId(null);
  }, []);

  // Reset simulation state when modal opens
  const handleOpenWithReset = useCallback((id: number) => {
    setSimulationActive(false);
    setOpenId(id);
  }, []);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (openId !== null) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [openId]);

  // Close on Escape — but only when simulation is NOT active
  useEffect(() => {
    if (openId === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openId, handleClose]);

  const openScenario = openId !== null ? SCENARIOS.find((s) => s.id === openId) : null;

  return (
    <div className="sd-page" data-theme={theme}>
      {/* Back link */}
      <button type="button" className="sd-back" onClick={onBack}>
        <span aria-hidden="true">←</span>
        <span>{t('demo.backToScenarios')}</span>
      </button>

      {/* Page header */}
      <header className="sd-header">
        <h1 className="sd-title">{t('demo.title')}</h1>
        <p className="sd-subtitle">{t('demo.description')}</p>
      </header>

      {/* Scenario grid — 3 columns x 2 rows */}
      <div className="sd-grid">
        {SCENARIOS.map((scenario) => {
          const isOpen = openId === scenario.id;
          return (
            <article
              key={scenario.id}
              className={`sd-card${isOpen ? ' sd-card-active' : ''}`}
              data-accent={scenario.id}
              role="button"
              tabIndex={0}
              aria-expanded={isOpen}
              aria-label={`${t(`demo.scenario${scenario.id}.title`)} — ${t('demo.viewScenario')}`}
              onClick={() => handleOpenWithReset(scenario.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOpenWithReset(scenario.id);
                }
              }}
            >
              <div className="sd-card-image">
                <img
                  src={scenario.image}
                  alt={t(`demo.scenario${scenario.id}.title`)}
                  loading="lazy"
                />
                <span className="sd-card-num">{t('demo.scenario')} {scenario.id}</span>
              </div>
              <div className="sd-card-body">
                <h3 className="sd-card-title">{t(`demo.scenario${scenario.id}.title`)}</h3>
                <p className="sd-card-desc">{t(`demo.scenario${scenario.id}.description`)}</p>
                <span className="sd-card-cta">
                  {t('demo.viewScenario')}
                  <span aria-hidden="true">→</span>
                </span>
              </div>
            </article>
          );
        })}
      </div>

      {/* Modal overlay with ScenarioDemoContent */}
      {openScenario && (
        <div
          className={`sd-modal-overlay${simulationActive ? ' sd-modal-overlay-locked' : ''}`}
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label={t(`demo.scenario${openScenario.id}.title`)}
        >
          <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sd-modal-header">
              <div className="sd-modal-titles">
                <span className="sd-modal-badge">
                  {t('demo.scenario')} {openScenario.id}
                </span>
                <h2 className="sd-modal-title">{t(`demo.scenario${openScenario.id}.title`)}</h2>
              </div>
              <button
                type="button"
                className="sd-modal-close"
                onClick={handleForceClose}
                aria-label={t('demo.hideScenario')}
              >
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="sd-modal-body">
              <ScenarioDemoContent
                scenarioId={openScenario.id}
                sessionPublicId={sessionPublicId}
                onSuspended={onSuspended}
                onClose={handleForceClose}
                onSimulationStateChange={setSimulationActive}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
