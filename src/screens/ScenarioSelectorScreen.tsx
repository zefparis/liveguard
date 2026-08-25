/**
 * LiveGuard — Scenario Selector Screen (accordion architecture)
 *
 * Shows 6 demo scenario cards. When a scenario card is tapped, it expands
 * IN PLACE (accordion) revealing the demo content directly below the card
 * header — the list is never unmounted, so scroll position is preserved
 * and there is no double-tap issue from scroll-inertia/remount conflicts.
 *
 * Affordance: the entire card header (image + badge + title + description
 * + chevron) is clickable. The chevron sits in a round circle (same visual
 * spirit as the .landing-status-icon badges on the home page) with a
 * discrete "Voir le scénario" label when collapsed. A subtle background
 * change + the chevron rotation give immediate tap feedback.
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { useState, useCallback } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { ScenarioDemoContent, SCENARIOS } from './ScenarioDemoContent';
import type { SuspensionData } from '../liveguard/behavior/telemetryTypes';

interface Props {
  sessionPublicId: string;
  onSuspended: (data: SuspensionData) => void;
  onBack: () => void;
}

export function ScenarioSelectorScreen({ sessionPublicId, onSuspended, onBack }: Props) {
  const { t } = useI18n();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [simulationActive, setSimulationActive] = useState(false);

  const handleToggle = useCallback((id: number) => {
    // Block toggling (collapse or switch) while a simulation is active.
    // The only way to close during simulation is the explicit close button
    // inside ScenarioDemoContent (which calls handleForceClose).
    if (simulationActive) return;
    setExpandedId((prev) => (prev === id ? null : id));
  }, [simulationActive]);

  // Explicit close — always allowed (used by the ✕ / "Fermer" button inside the content)
  const handleForceClose = useCallback(() => {
    setSimulationActive(false);
    setExpandedId(null);
  }, []);

  return (
    <div className="landing-page" style={{ paddingTop: '20px' }}>
      <button
        type="button"
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: '#60a5fa',
          fontSize: '13px',
          marginBottom: '12px',
          cursor: 'pointer',
        }}
      >
        ← {t('demo.backToScenarios')}
      </button>

      <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>
        {t('demo.title')}
      </h1>
      <p className="muted" style={{ fontSize: '13px', marginBottom: '20px' }}>
        {t('demo.description')}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {SCENARIOS.map((scenario) => {
          const isExpanded = expandedId === scenario.id;
          return (
            <div
              key={scenario.id}
              data-scenario-id={scenario.id}
              data-expanded={isExpanded}
              className="scenario-accordion-card"
            >
              {/* Card header — entire surface is clickable (disabled during active simulation) */}
              <div
                role="button"
                tabIndex={simulationActive && isExpanded ? -1 : 0}
                aria-expanded={isExpanded}
                aria-disabled={simulationActive && isExpanded}
                aria-label={`${t(`demo.scenario${scenario.id}.title`)} — ${isExpanded ? t('demo.hideScenario') : t('demo.viewScenario')}`}
                onClick={() => handleToggle(scenario.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleToggle(scenario.id);
                  }
                }}
                className="scenario-accordion-header"
              >
                <div style={{
                  height: '130px',
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <img
                    src={scenario.image}
                    alt={t(`demo.scenario${scenario.id}.title`)}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                  {isExpanded && (
                    <div className="scenario-active-badge">●</div>
                  )}
                </div>

                <div style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ minWidth: 0 }}>
                      <span style={{
                        display: 'inline-block',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        background: 'rgba(59, 130, 246, 0.2)',
                        color: '#60a5fa',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        marginRight: '8px',
                      }}>
                        {t('demo.scenario')} {scenario.id}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>
                        {t(`demo.scenario${scenario.id}.title`)}
                      </span>
                    </div>
                    {/* Chevron in a round circle + discrete label — same
                        visual spirit as .landing-status-icon on the home
                        page. The whole wrap is decorative (the entire
                        header is clickable), this is just an affordance
                        indicator. */}
                    <span className="scenario-chevron-wrap">
                      <span className="scenario-chevron-label">
                        {t('demo.viewScenario')}
                      </span>
                      <span className="scenario-chevron-circle">▼</span>
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#888', marginBottom: '0', lineHeight: 1.4 }}>
                    {t(`demo.scenario${scenario.id}.description`)}
                  </p>
                </div>
              </div>

              {/* Accordion content — rendered inline, no remount of the list */}
              {isExpanded && (
                <div style={{ padding: '0 14px 14px' }}>
                  <ScenarioDemoContent
                    scenarioId={scenario.id}
                    sessionPublicId={sessionPublicId}
                    onSuspended={onSuspended}
                    onClose={handleForceClose}
                    onSimulationStateChange={setSimulationActive}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
