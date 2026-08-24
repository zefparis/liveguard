/**
 * Regression tests for the 3 fixes from the black-box Playwright audit
 * on liveguards.app (2026-08-24).
 *
 * Fix 1 (HIGH): signal_analysis.log must not expose real detection thresholds.
 * Fix 2 (HIGH): session-behavior-ping Vercel proxy must include /api in the
 *   upstream path (hybrid-vector-api mounts routes under /api).
 * Fix 3 (MEDIUM): liveguard session creation rate limit lowered from 25 to 5
 *   per IP per minute.
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * @license Patents Pending FR2514274 | FR2514546
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// ─── Fix 1: Threshold redaction in sessionSuspendedShared.ts ─────────
const SUSPENDED_SRC = readFileSync(
  join(process.cwd(), 'src/screens/sessionSuspendedShared.ts'),
  'utf-8',
);

describe('Fix 1 — signal_analysis.log threshold redaction', () => {
  it('does not expose the real EMA threshold (45.0%)', () => {
    expect(SUSPENDED_SRC).not.toMatch(/threshold:\s*45\.0%/);
    expect(SUSPENDED_SRC).not.toMatch(/threshold:\s*45%/);
  });

  it('does not expose the real mass_attempts threshold (8)', () => {
    expect(SUSPENDED_SRC).not.toMatch(/threshold:\s*8/);
    expect(SUSPENDED_SRC).not.toMatch(/risk_score.*\/\s*8/);
  });

  it('does not expose the real tolerance threshold in ms (3000)', () => {
    expect(SUSPENDED_SRC).not.toMatch(/tolerance_threshold:\s*\$\{.*toleranceMs/);
    expect(SUSPENDED_SRC).not.toMatch(/tolerance_threshold:\s*3000/);
  });

  it('does not expose the exact EMA score value in the trigger line', () => {
    // The old code had: `> trigger: behavioral_divergence (EMA=${(div * 100).toFixed(1)}%)`
    expect(SUSPENDED_SRC).not.toMatch(/trigger:\s*behavioral_divergence\s*\(EMA=/);
  });

  it('does not expose the exact exceeded_by calculation', () => {
    expect(SUSPENDED_SRC).not.toMatch(/exceeded_by/);
  });

  it('does not expose consecutive_breaches denominator (3)', () => {
    // The old code had: `consecutive_breaches: ${breaches} / 3`
    expect(SUSPENDED_SRC).not.toMatch(/\/\s*3/);
  });

  it('does not expose raw ref/obs values in feature_breakdown', () => {
    // The old code had: `ref=${f.reference ?? 'null'}  obs=${f.current ?? 'null'}`
    expect(SUSPENDED_SRC).not.toMatch(/ref=\$\{f\.reference/);
    expect(SUSPENDED_SRC).not.toMatch(/obs=\$\{f\.current/);
  });

  it('uses [redacted] for threshold values', () => {
    expect(SUSPENDED_SRC).toMatch(/\[redacted\]/);
  });

  it('still displays the session state (INVALIDATED)', () => {
    expect(SUSPENDED_SRC).toMatch(/session_state:\s*INVALIDATED/);
  });

  it('still displays the trigger reason (without exact values)', () => {
    expect(SUSPENDED_SRC).toMatch(/trigger:\s*behavioral_divergence/);
    expect(SUSPENDED_SRC).toMatch(/trigger:\s*background_timeout/);
    expect(SUSPENDED_SRC).toMatch(/trigger:\s*mass_attempts_blocked/);
  });
});

// ─── Fix 2: session-behavior-ping upstream URL ───────────────────────
const PING_PROXY_SRC = readFileSync(
  join(process.cwd(), 'api/liveguard/session-behavior-ping.ts'),
  'utf-8',
);

describe('Fix 2 — session-behavior-ping upstream URL includes /api', () => {
  it('includes /api in the upstream path', () => {
    // The hybrid-vector-api mounts routes under /api (app.use('/api', ...))
    // The Worker strips /hv, so the path after stripping must include /api
    expect(PING_PROXY_SRC).toMatch(/\/api\/liveguard\/session-behavior-ping/);
  });

  it('does not use the old path without /api', () => {
    // The old code was: `${base}/liveguard/session-behavior-ping` (no /api)
    // This would result in /hv/liveguard/session-behavior-ping → stripped to
    // /liveguard/session-behavior-ping → 404 on hybrid-vector-api
    expect(PING_PROXY_SRC).not.toMatch(
      /`\$\{base\.replace\(\/\\\/\+\$\/,?\s*''\)\}\/liveguard\/session-behavior-ping`/,
    );
  });

  it('routes through the Cloudflare Worker (/hv prefix)', () => {
    expect(PING_PROXY_SRC).toMatch(/api\.hcs-u7\.org\/hv/);
  });
});

// ─── Fix 3: Rate limit lowered from 25 to 5 ──────────────────────────
const SESSION_ROUTE_SRC = readFileSync(
  join(process.cwd(), '..', 'hcs-u7-backend', 'src/routes/liveguard-session.routes.ts'),
  'utf-8',
);

describe('Fix 3 — liveguard session creation rate limit', () => {
  it('uses RATE_LIMIT_MAX = 5 (not 25)', () => {
    expect(SESSION_ROUTE_SRC).toMatch(/RATE_LIMIT_MAX\s*=\s*5\b/);
    expect(SESSION_ROUTE_SRC).not.toMatch(/RATE_LIMIT_MAX\s*=\s*25\b/);
  });

  it('the log message reflects the new limit (5/min)', () => {
    expect(SESSION_ROUTE_SRC).toMatch(/rate-limited\s+5\/min/);
    expect(SESSION_ROUTE_SRC).not.toMatch(/rate-limited\s+25\/min/);
  });

  it('still has the rate limit preHandler registered', () => {
    expect(SESSION_ROUTE_SRC).toMatch(/preHandler:\s*redisRateLimitPreHandler/);
  });

  it('still returns 429 when limit is exceeded', () => {
    expect(SESSION_ROUTE_SRC).toMatch(/code\(429\)/);
  });
});
