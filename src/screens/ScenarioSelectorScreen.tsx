/**
 * LiveGuard — Scenario Selector Screen (accordion architecture)
 *
 * Shows 6 demo scenario cards. When a scenario card is tapped, it expands
 * IN PLACE (accordion) revealing the demo content directly below the card
 * header — the list is never unmounted, so scroll position is preserved
 * and there is no double-tap issue from scroll-inertia/remount conflicts.
 *
 * The previous architecture (phase: scenario_selector → scenario_demo)
 * unmounted this screen and mounted ScenarioDemoScreen separately, causing:
 *   1. Double-tap on mobile (first tap consumed by scroll-inertia stop)
 *   2. Scroll position lost on return (list remounted at scrollTop=0)
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

  const handleToggle = useCallback((id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleClose = useCallback(() => {
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
              style={{
                background: 'var(--surface, #1a1a2e)',
                border: `1px solid ${isExpanded ? 'var(--accent, #3b82f6)' : 'var(--surface-2, #2a2a4e)'}`,
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'border-color 0.2s ease',
              }}
            >
              {/* Card header — always visible, tap to expand/collapse */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleToggle(scenario.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleToggle(scenario.id);
                  }
                }}
                style={{ cursor: 'pointer' }}
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
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(59, 130, 246, 0.9)',
                      color: '#fff',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}>
                      ●
                    </div>
                  )}
                </div>

                <div style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
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
                    <span style={{
                      fontSize: '12px',
                      color: isExpanded ? '#60a5fa' : '#666',
                      transition: 'transform 0.2s ease, color 0.2s ease',
                      transform: isExpanded ? 'rotate(180deg)' : 'none',
                    }}>
                      ▼
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
                    onClose={handleClose}
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
