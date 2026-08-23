/**
 * LiveGuard — Lightweight behavioral signal collector
 *
 * Ported verbatim from pulseguard-app. Generic, zero PulseGuard dependencies.
 *
 * Inspired by hcs-widget-mvp/telemetry/behavior.ts but stripped down
 * to the essentials for session-based continuous verification.
 *
 * Collects:
 *   - Mouse movement (speed, curvature, pauses)
 *   - Keystroke dynamics (intervals, hold time, variance)
 *   - Touch patterns (intervals, variance) — mobile only
 *   - Scroll timing (speed, pauses)
 *
 * Activated ONLY during a scenario demo (ScenarioDemoScreen).
 * Never active elsewhere in the app. All listeners are removed on stop.
 *
 * No raw coordinates, keystroke content, or touch paths are stored.
 * Only safe aggregates.
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import type { BehaviorSnapshot } from './telemetryTypes';

// ─── Internal state ──────────────────────────────────────────────────

interface CollectorState {
  running: boolean;

  // Mouse
  mouseEvents: { t: number; x: number; y: number }[];
  mouseLastMoveAt: number;
  mousePauseCount: number;
  mouseTotalDistance: number;
  mouseDirectionChanges: number;
  mouseLastDx: number;
  mouseLastDy: number;

  // Keystroke
  keystrokeTimestamps: number[];
  keystrokeDownAt: number;
  keystrokeHoldTimes: number[];

  // Touch
  touchTimestamps: number[];

  // Scroll
  scrollEvents: { t: number; deltaY: number }[];
  scrollLastAt: number;
  scrollPauseCount: number;
  scrollTotalDelta: number;

  // Listeners (for cleanup)
  onMouseMove: ((e: MouseEvent) => void) | null;
  onKeyDown: ((e: KeyboardEvent) => void) | null;
  onKeyUp: ((e: KeyboardEvent) => void) | null;
  onTouchStart: ((e: TouchEvent) => void) | null;
  onWheel: ((e: WheelEvent) => void) | null;
}

let state: CollectorState | null = null;

const MOUSE_PAUSE_THRESHOLD_MS = 500;
const SCROLL_PAUSE_THRESHOLD_MS = 800;
const MAX_EVENTS = 500; // Cap to prevent memory growth

// ─── Helpers ─────────────────────────────────────────────────────────

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

// ─── Public API ──────────────────────────────────────────────────────

export function startBehaviorCollection(): void {
  if (state?.running) return;

  const s: CollectorState = {
    running: true,
    mouseEvents: [],
    mouseLastMoveAt: 0,
    mousePauseCount: 0,
    mouseTotalDistance: 0,
    mouseDirectionChanges: 0,
    mouseLastDx: 0,
    mouseLastDy: 0,
    keystrokeTimestamps: [],
    keystrokeDownAt: 0,
    keystrokeHoldTimes: [],
    touchTimestamps: [],
    scrollEvents: [],
    scrollLastAt: 0,
    scrollPauseCount: 0,
    scrollTotalDelta: 0,
    onMouseMove: null,
    onKeyDown: null,
    onKeyUp: null,
    onTouchStart: null,
    onWheel: null,
  };

  // Mouse movement
  s.onMouseMove = (e: MouseEvent) => {
    if (!state?.running) return;
    const now = performance.now();

    // Pause detection
    if (state.mouseLastMoveAt > 0 && now - state.mouseLastMoveAt > MOUSE_PAUSE_THRESHOLD_MS) {
      state.mousePauseCount++;
    }
    state.mouseLastMoveAt = now;

    // Distance and direction
    const last = state.mouseEvents[state.mouseEvents.length - 1];
    if (last) {
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      state.mouseTotalDistance += dist;

      // Direction change detection (significant angle change)
      if (state.mouseLastDx !== 0 || state.mouseLastDy !== 0) {
        const lastAngle = Math.atan2(state.mouseLastDy, state.mouseLastDx);
        const currAngle = Math.atan2(dy, dx);
        const angleDiff = Math.abs(currAngle - lastAngle);
        if (angleDiff > Math.PI / 3 && dist > 5) {
          state.mouseDirectionChanges++;
        }
      }
      state.mouseLastDx = dx;
      state.mouseLastDy = dy;
    }

    state.mouseEvents.push({ t: now, x: e.clientX, y: e.clientY });
    if (state.mouseEvents.length > MAX_EVENTS) {
      state.mouseEvents.shift();
    }
  };

  // Keystroke dynamics
  s.onKeyDown = (e: KeyboardEvent) => {
    if (!state?.running) return;
    // Ignore modifier keys and function keys
    if (e.key.length > 1 && e.key !== 'Backspace' && e.key !== 'Delete') return;
    state.keystrokeDownAt = performance.now();
  };

  s.onKeyUp = (e: KeyboardEvent) => {
    if (!state?.running) return;
    if (e.key.length > 1 && e.key !== 'Backspace' && e.key !== 'Delete') return;
    const now = performance.now();
    if (state.keystrokeDownAt > 0) {
      state.keystrokeHoldTimes.push(now - state.keystrokeDownAt);
      state.keystrokeDownAt = 0;
    }
    state.keystrokeTimestamps.push(now);
    if (state.keystrokeTimestamps.length > MAX_EVENTS) {
      state.keystrokeTimestamps.shift();
    }
  };

  // Touch (mobile)
  s.onTouchStart = (_e: TouchEvent) => {
    if (!state?.running) return;
    state.touchTimestamps.push(performance.now());
    if (state.touchTimestamps.length > MAX_EVENTS) {
      state.touchTimestamps.shift();
    }
  };

  // Scroll
  s.onWheel = (e: WheelEvent) => {
    if (!state?.running) return;
    const now = performance.now();

    if (state.scrollLastAt > 0 && now - state.scrollLastAt > SCROLL_PAUSE_THRESHOLD_MS) {
      state.scrollPauseCount++;
    }
    state.scrollLastAt = now;
    state.scrollTotalDelta += Math.abs(e.deltaY);
    state.scrollEvents.push({ t: now, deltaY: e.deltaY });
    if (state.scrollEvents.length > MAX_EVENTS) {
      state.scrollEvents.shift();
    }
  };

  document.addEventListener('mousemove', s.onMouseMove, { passive: true });
  document.addEventListener('keydown', s.onKeyDown, { passive: true });
  document.addEventListener('keyup', s.onKeyUp, { passive: true });
  document.addEventListener('touchstart', s.onTouchStart, { passive: true });
  document.addEventListener('wheel', s.onWheel, { passive: true });

  state = s;
}

export function stopBehaviorCollection(): void {
  if (!state) return;
  state.running = false;

  if (state.onMouseMove) document.removeEventListener('mousemove', state.onMouseMove);
  if (state.onKeyDown) document.removeEventListener('keydown', state.onKeyDown);
  if (state.onKeyUp) document.removeEventListener('keyup', state.onKeyUp);
  if (state.onTouchStart) document.removeEventListener('touchstart', state.onTouchStart);
  if (state.onWheel) document.removeEventListener('wheel', state.onWheel);

  state = null;
}

export function isBehaviorCollecting(): boolean {
  return state?.running ?? false;
}

/**
 * Get the current behavioral snapshot without stopping collection.
 * Resets accumulators after reading (sliding window per beacon interval).
 */
export function getBehaviorSnapshot(): BehaviorSnapshot {
  if (!state || !state.running) {
    return emptySnapshot();
  }

  const s = state;

  // Mouse metrics
  const mouseEventCount = s.mouseEvents.length;
  let mouseSpeedAvg: number | null = null;
  let mouseCurvatureAvg: number | null = null;

  if (mouseEventCount > 1) {
    const timeSpanMs = s.mouseEvents[mouseEventCount - 1].t - s.mouseEvents[0].t;
    if (timeSpanMs > 0) {
      mouseSpeedAvg = Math.round((s.mouseTotalDistance / timeSpanMs) * 1000); // px/s
    }
    mouseCurvatureAvg = mouseEventCount > 2
      ? Math.round(clamp(s.mouseDirectionChanges / (mouseEventCount - 1), 0, 1) * 100) / 100
      : 0;
  }

  // Keystroke metrics
  const keystrokeCount = s.keystrokeTimestamps.length;
  let keystrokeIntervalAvg: number | null = null;
  let keystrokeHoldAvg: number | null = null;
  let keystrokeVariance: number | null = null;

  if (keystrokeCount > 0) {
    keystrokeHoldAvg = s.keystrokeHoldTimes.length > 0
      ? Math.round(mean(s.keystrokeHoldTimes))
      : null;

    if (keystrokeCount > 1) {
      const intervals: number[] = [];
      for (let i = 1; i < s.keystrokeTimestamps.length; i++) {
        intervals.push(s.keystrokeTimestamps[i] - s.keystrokeTimestamps[i - 1]);
      }
      keystrokeIntervalAvg = Math.round(mean(intervals));
      keystrokeVariance = Math.round(variance(intervals));
    }
  }

  // Touch metrics
  const touchCount = s.touchTimestamps.length;
  let touchIntervalAvg: number | null = null;
  let touchVariance: number | null = null;

  if (touchCount > 1) {
    const intervals: number[] = [];
    for (let i = 1; i < s.touchTimestamps.length; i++) {
      intervals.push(s.touchTimestamps[i] - s.touchTimestamps[i - 1]);
    }
    touchIntervalAvg = Math.round(mean(intervals));
    touchVariance = Math.round(variance(intervals));
  }

  // Scroll metrics
  const scrollEventCount = s.scrollEvents.length;
  let scrollSpeedAvg: number | null = null;

  if (scrollEventCount > 1) {
    const timeSpanMs = s.scrollEvents[scrollEventCount - 1].t - s.scrollEvents[0].t;
    if (timeSpanMs > 0) {
      scrollSpeedAvg = Math.round((s.scrollTotalDelta / timeSpanMs) * 1000); // px/s
    }
  }

  const snapshot: BehaviorSnapshot = {
    mouseSpeedAvg,
    mouseCurvatureAvg,
    mousePauseCount: s.mousePauseCount,
    mouseEventCount,
    keystrokeIntervalAvg,
    keystrokeHoldAvg,
    keystrokeVariance,
    keystrokeCount,
    touchIntervalAvg,
    touchVariance,
    touchCount,
    scrollSpeedAvg,
    scrollPauseCount: s.scrollPauseCount,
    scrollEventCount,
    totalEvents: mouseEventCount + keystrokeCount + touchCount + scrollEventCount,
    timestamp: new Date().toISOString(),
  };

  // Reset accumulators for next window
  s.mouseEvents = [];
  s.mouseLastMoveAt = 0;
  s.mousePauseCount = 0;
  s.mouseTotalDistance = 0;
  s.mouseDirectionChanges = 0;
  s.mouseLastDx = 0;
  s.mouseLastDy = 0;
  s.keystrokeTimestamps = [];
  s.keystrokeHoldTimes = [];
  s.keystrokeDownAt = 0;
  s.touchTimestamps = [];
  s.scrollEvents = [];
  s.scrollLastAt = 0;
  s.scrollPauseCount = 0;
  s.scrollTotalDelta = 0;

  return snapshot;
}

function emptySnapshot(): BehaviorSnapshot {
  return {
    mouseSpeedAvg: null,
    mouseCurvatureAvg: null,
    mousePauseCount: 0,
    mouseEventCount: 0,
    keystrokeIntervalAvg: null,
    keystrokeHoldAvg: null,
    keystrokeVariance: null,
    keystrokeCount: 0,
    touchIntervalAvg: null,
    touchVariance: null,
    touchCount: 0,
    scrollSpeedAvg: null,
    scrollPauseCount: 0,
    scrollEventCount: 0,
    totalEvents: 0,
    timestamp: new Date().toISOString(),
  };
}
