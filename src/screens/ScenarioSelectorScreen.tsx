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

import { useEffect, useRef } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const renderCount = useRef(0);
  renderCount.current++;
  console.info('[S-SCROLL] render #' + renderCount.current,
    'containerRef.current=', containerRef.current,
    'scrollTop=', containerRef.current?.scrollTop,
    'scrollHeight=', containerRef.current?.scrollHeight,
    'clientHeight=', containerRef.current?.clientHeight,
    'app-shell height=', document.querySelector('.app-shell')?.getBoundingClientRect().height,
    'window.innerHeight=', window.innerHeight,
    'visualViewport.height=', window.visualViewport?.height,
  );

  // ── DEBUG: attach scroll listeners to ALL candidate scrollable elements ──
  useEffect(() => {
    // Check for multiple .landing-page instances
    const allLanding = document.querySelectorAll('.landing-page');
    console.info('[S-SCROLL] querySelectorAll(.landing-page).length =', allLanding.length);
    allLanding.forEach((el, i) => {
      const style = getComputedStyle(el);
      console.info('[S-SCROLL] .landing-page[' + i + ']', {
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        overflowY: style.overflowY,
        position: style.position,
        zIndex: style.zIndex,
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        offsetParent: (el as HTMLElement).offsetParent?.tagName,
        rect: el.getBoundingClientRect(),
        isSameAsContainerRef: el === containerRef.current,
      });
    });

    // Walk up DOM from containerRef to find all ancestors and their scroll behavior
    if (containerRef.current) {
      let node: Element | null = containerRef.current;
      let depth = 0;
      while (node && depth < 20) {
        const style = getComputedStyle(node);
        console.info('[S-SCROLL] ancestor[' + depth + ']', node.tagName + '.' + node.className,
          'scrollTop=', node.scrollTop,
          'scrollHeight=', node.scrollHeight,
          'clientHeight=', node.clientHeight,
          'overflowY=', style.overflowY,
          'height=', style.height,
          'rect=', node.getBoundingClientRect(),
        );
        node = node.parentElement;
        depth++;
      }
    }

    const candidates: { name: string; el: Element | Window | Document }[] = [
      { name: 'window', el: window },
      { name: 'document', el: document },
      { name: 'html', el: document.documentElement },
      { name: 'body', el: document.body },
    ];
    const root = document.getElementById('root');
    if (root) candidates.push({ name: '#root', el: root });
    const shell = document.querySelector('.app-shell');
    if (shell) candidates.push({ name: '.app-shell', el: shell });
    allLanding.forEach((el, i) => candidates.push({ name: '.landing-page[' + i + ']', el }));

    // Log initial state of each candidate
    candidates.forEach(({ name, el }) => {
      const e = el as Element;
      if (e && e.tagName) {
        const style = getComputedStyle(e);
        console.info('[S-SCROLL] candidate', name, {
          scrollTop: e.scrollTop,
          scrollHeight: e.scrollHeight,
          clientHeight: e.clientHeight,
          overflowY: style.overflowY,
          offsetHeight: (e as HTMLElement).offsetHeight,
          rect: e.getBoundingClientRect(),
        });
      }
    });

    // Attach scroll listeners
    const handlers: { name: string; fn: () => void }[] = [];
    candidates.forEach(({ name, el }) => {
      const fn = () => {
        const e = el as Element;
        if (e && e.tagName) {
          console.info('[S-SCROLL] SCROLL EVENT on', name, 'scrollTop=', e.scrollTop);
        } else if (el === window) {
          console.info('[S-SCROLL] SCROLL EVENT on window, scrollY=', window.scrollY);
        }
      };
      (el as EventTarget).addEventListener('scroll', fn, { passive: true });
      handlers.push({ name, fn });
    });

    return () => {
      handlers.forEach(({ name, fn }) => {
        const candidate = candidates.find(c => c.name === name);
        if (candidate) (candidate.el as EventTarget).removeEventListener('scroll', fn);
      });
    };
  }, []);

  // Restore scroll position on mount (saved before navigating to detail)
  useEffect(() => {
    const saved = sessionStorage.getItem('lg_scenario_scroll');
    console.info('[S-SCROLL] mount useEffect — sessionStorage saved=', saved,
      'containerRef.current=', containerRef.current,
      'app-shell height=', document.querySelector('.app-shell')?.getBoundingClientRect().height,
    );
    if (saved) {
      const pos = parseInt(saved, 10);
      if (pos > 0 && containerRef.current) {
        console.info('[S-SCROLL] about to restore, pos=', pos, 'current scrollTop=', containerRef.current.scrollTop);
        requestAnimationFrame(() => {
          if (containerRef.current) {
            console.info('[S-SCROLL] rAF: before restore, scrollTop=', containerRef.current.scrollTop,
              'scrollHeight=', containerRef.current.scrollHeight,
              'clientHeight=', containerRef.current.clientHeight,
              'app-shell height=', document.querySelector('.app-shell')?.getBoundingClientRect().height,
            );
            containerRef.current.scrollTop = pos;
            console.info('[S-SCROLL] rAF: after restore, scrollTop=', containerRef.current.scrollTop, 'expected=', pos);
            // Check again after a short delay to see if something overwrites it
            setTimeout(() => {
              console.info('[S-SCROLL] rAF+100ms: scrollTop=', containerRef.current?.scrollTop, 'expected=', pos);
            }, 100);
          } else {
            console.info('[S-SCROLL] rAF: containerRef.current is NULL');
          }
        });
      } else {
        console.info('[S-SCROLL] skip restore: pos=', pos, 'containerRef=', containerRef.current);
      }
      sessionStorage.removeItem('lg_scenario_scroll');
    }
  }, []);

  // Log scrollTop on every re-render
  useEffect(() => {
    console.info('[S-SCROLL] render-effect #' + renderCount.current, 'scrollTop=', containerRef.current?.scrollTop);
  });

  const handleSelect = () => {
    const el = containerRef.current;
    const st = el?.scrollTop;
    console.info('[S-SCROLL] handleSelect — containerRef.current=', el, 'scrollTop=', st);
    if (el) {
      sessionStorage.setItem('lg_scenario_scroll', String(st));
      console.info('[S-SCROLL] handleSelect — saved to sessionStorage:', String(st));
    } else {
      console.info('[S-SCROLL] handleSelect — containerRef is NULL, nothing saved');
    }
    onSelectScenario();
  };

  return (
    <div ref={containerRef} className="landing-page" style={{ paddingTop: '20px' }}>
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
                onClick={handleSelect}
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
