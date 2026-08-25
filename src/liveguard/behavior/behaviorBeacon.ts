/**
 * LiveGuard — Passive behavior beacon
 *
 * Adapted from pulseguard-app/behaviorBeacon.ts:
 *   - Changed URL to /api/liveguard/session-behavior-ping
 *   - Removed VITE_PULSEGUARD_API_KEY (LiveGuard is public, no API key)
 *   - Removed linkToken from payload
 *   - Added source: 'liveguard', deviceProfileId, deviceContext to payload
 *
 * Sends behavioral snapshots to the backend every 5-10s via fire-and-forget.
 * Never blocks the UI. Fail-closed: if the endpoint fails or times out,
 * the session is NEVER blocked — the error is logged and the beacon
 * continues on the next interval.
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { getBehaviorSnapshot, isBehaviorCollecting } from './behaviorCollector';
import type { BehaviorBeaconConfig, BehaviorPingResponse, DemoSimulationMode, DeviceContext } from './telemetryTypes';
import { applyDemoSimulation } from './demoSimulator';

// 15s timeout — matches the Vercel proxy's UPSTREAM_TIMEOUT_MS (15s in verify.ts).
// The Vercel serverless function can cold-start in ~8-9s on the first call,
// and the upstream Worker + hybrid-vector-api chain adds further latency.
// The previous 5s timeout caused all behavior-pings to abort before the
// proxy could respond, making the demo entirely client-side (502 + timeout).
const BEACON_TIMEOUT_MS = 15_000;
const MIN_EVENTS_FOR_BEACON = 3;

const DEVICE_PROFILE_STORAGE_KEY = 'lg_device_profile_id';

let intervalId: ReturnType<typeof setInterval> | null = null;
let beaconConfig: BehaviorBeaconConfig | null = null;
let demoMode: DemoSimulationMode = 'none';
let onInvalidationCallback: (() => void) | null = null;
let onNetworkRiskUpdate: ((score: number) => void) | null = null;

/**
 * Get or create an anonymous device profile ID (Part E.5).
 * Stored in localStorage, sent with each ping for longitudinal profiling.
 * Purely technical — no personal data, just a random UUID.
 */
export function getOrCreateDeviceProfileId(): string {
  try {
    let id = localStorage.getItem(DEVICE_PROFILE_STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_PROFILE_STORAGE_KEY, id);
    }
    return id;
  } catch {
    // localStorage not available (private browsing, SSR, etc.)
    return crypto.randomUUID();
  }
}

/**
 * Collect device context for normalization (Part E.3).
 */
export function collectDeviceContext(): DeviceContext {
  const ua = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  const isTablet = /iPad|Tablet/i.test(ua);
  return {
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    pixelRatio: window.devicePixelRatio || 1,
    platform: isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop',
  };
}

/**
 * Start the periodic behavior beacon.
 * The collector must already be running (startBehaviorCollection).
 */
export function startBehaviorBeacon(
  config: BehaviorBeaconConfig,
  callbacks?: {
    onInvalidation?: () => void;
    onNetworkRiskUpdate?: (score: number) => void;
  },
): void {
  if (intervalId) return;
  beaconConfig = config;
  onInvalidationCallback = callbacks?.onInvalidation ?? null;
  onNetworkRiskUpdate = callbacks?.onNetworkRiskUpdate ?? null;

  intervalId = setInterval(() => {
    void sendBeacon();
  }, config.intervalMs);
}

export function stopBehaviorBeacon(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  beaconConfig = null;
  demoMode = 'none';
  onInvalidationCallback = null;
  onNetworkRiskUpdate = null;
}

/**
 * Set the demo simulation mode. Only effective when beaconConfig.isDemo is true.
 * DEMO ONLY — never callable outside ScenarioDemoScreen context.
 */
export function setDemoSimulationMode(mode: DemoSimulationMode): void {
  if (!beaconConfig?.isDemo) {
    console.warn('[LiveGuard] setDemoSimulationMode ignored — not in demo context');
    return;
  }
  demoMode = mode;
}

export function getDemoSimulationMode(): DemoSimulationMode {
  return demoMode;
}

/**
 * Send a single beacon. Fire-and-forget — errors are logged, never thrown.
 * Fail-closed: if the endpoint fails, the session continues normally.
 */
async function sendBeacon(): Promise<void> {
  if (!beaconConfig || !isBehaviorCollecting()) return;

  let snapshot = getBehaviorSnapshot();

  // Apply demo simulation if enabled (demo-only, never in production)
  if (beaconConfig.isDemo && demoMode !== 'none') {
    snapshot = applyDemoSimulation(snapshot, demoMode);
  }

  // Skip if not enough interaction data
  if (snapshot.totalEvents < MIN_EVENTS_FOR_BEACON) return;

  const payload = {
    sessionId: beaconConfig.sessionPublicId,
    source: beaconConfig.source,
    isDemo: beaconConfig.isDemo,
    snapshot,
    deviceProfileId: beaconConfig.deviceProfileId,
    deviceContext: beaconConfig.deviceContext,
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), BEACON_TIMEOUT_MS);

    // Real test pings go to the dedicated /test/ endpoint so the server can
    // persist them for Label Studio. Demo pings go to the regular endpoint
    // and are never persisted. The endpoint URL is the sole authority —
    // the client-supplied isDemo flag is not trusted for persistence.
    const endpoint = beaconConfig.isDemo
      ? '/api/liveguard/session-behavior-ping'
      : '/api/liveguard/test/session-behavior-ping';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        console.warn(
          `[LiveGuard] Behavior beacon HTTP ${res.status} (suppressed — fail-closed)`,
        );
        return;
      }

      const body = (await res.json()) as BehaviorPingResponse;

      if (body.invalidated && onInvalidationCallback) {
        console.info('[LiveGuard] Session invalidated by behavior beacon — triggering re-verification');
        onInvalidationCallback();
      }

      if (body.networkRiskScore !== undefined && onNetworkRiskUpdate) {
        onNetworkRiskUpdate(body.networkRiskScore);
      }
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    // Fail-closed: never block on beacon failure
    console.warn(
      '[LiveGuard] Behavior beacon failed (suppressed — fail-closed):',
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * Force-send a beacon immediately (used by demo simulation buttons).
 */
export async function forceBeaconNow(): Promise<BehaviorPingResponse | null> {
  if (!beaconConfig || !isBehaviorCollecting()) return null;

  let snapshot = getBehaviorSnapshot();

  if (beaconConfig.isDemo && demoMode !== 'none') {
    snapshot = applyDemoSimulation(snapshot, demoMode);
  }

  if (snapshot.totalEvents < 1) {
    // Generate synthetic minimal snapshot for demo purposes
    snapshot = {
      ...snapshot,
      mouseEventCount: 5,
      keystrokeCount: 3,
      totalEvents: 8,
      timestamp: new Date().toISOString(),
    };
  }

  const payload = {
    sessionId: beaconConfig.sessionPublicId,
    source: beaconConfig.source,
    isDemo: beaconConfig.isDemo,
    snapshot,
    deviceProfileId: beaconConfig.deviceProfileId,
    deviceContext: beaconConfig.deviceContext,
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), BEACON_TIMEOUT_MS);

    const endpoint = beaconConfig.isDemo
      ? '/api/liveguard/session-behavior-ping'
      : '/api/liveguard/test/session-behavior-ping';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) return null;

      const body = (await res.json()) as BehaviorPingResponse;

      if (body.invalidated && onInvalidationCallback) {
        onInvalidationCallback();
      }

      if (body.networkRiskScore !== undefined && onNetworkRiskUpdate) {
        onNetworkRiskUpdate(body.networkRiskScore);
      }

      return body;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}
