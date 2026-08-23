/**
 * LiveGuard — Scenario Selector Screen
 *
 * Shows 6 demo scenario cards. When a scenario is selected, transitions
 * to scenario_demo phase with the LiveGuard session.
 *
 * Adapted from pulseguard-app but:
 *   - No linkToken (LiveGuard is public)
 *   - Uses LiveGuard i18n keys
 *   - Dispatches reducer action instead of local state
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { useI18n } from '../i18n/I18nContext';

interface ScenarioInfo {
  id: number;
  key: string;
  image: string;
}

const SCENARIOS: ScenarioInfo[] = [
  { id: 1, key: 'blur_focus', image: '/scenarios/1.jpeg' },
  { id: 2, key: 'mouse_behavior', image: '/scenarios/2.jpeg' },
  { id: 3, key: 'bot_detection', image: '/scenarios/3.jpeg' },
  { id: 4, key: 'touch_pattern', image: '/scenarios/4.jpeg' },
  { id: 5, key: 'session_continuity', image: '/scenarios/5.jpeg' },
  { id: 6, key: 'mass_attempts', image: '/scenarios/6.jpeg' },
];

interface Props {
  sessionPublicId: string;
  onSelectScenario: () => void;
  onBack: () => void;
}

export function ScenarioSelectorScreen({ sessionPublicId: _sessionPublicId, onSelectScenario, onBack }: Props) {
  const { t } = useI18n();

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
        {SCENARIOS.map((scenario) => (
          <div
            key={scenario.id}
            style={{
              background: 'var(--surface, #1a1a2e)',
              border: '1px solid var(--surface-2, #2a2a4e)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
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
              </div>
              <p style={{ fontSize: '12px', color: '#888', marginBottom: '10px', lineHeight: 1.4 }}>
                {t(`demo.scenario${scenario.id}.description`)}
              </p>
              <button
                type="button"
                className="btn"
                onClick={onSelectScenario}
                style={{
                  width: '100%',
                  fontSize: '13px',
                  padding: '8px',
                }}
              >
                {t(`demo.scenario${scenario.id}.button`)}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
