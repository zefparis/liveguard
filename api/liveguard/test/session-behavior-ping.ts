/**
 * LiveGuard — Test Behavior ping proxy (Vercel serverless function)
 *
 * POST /api/liveguard/test/session-behavior-ping
 *
 * Forwards behavioral telemetry pings from the LiveGuard real test parcours
 * (prep → test_reflex → ... → done) to the hybrid-vector-api backend.
 *
 * This is a SEPARATE proxy from the demo behavior-ping (api/liveguard/
 * session-behavior-ping.ts) because the upstream endpoint is different:
 *   - Demo:  /api/liveguard/session-behavior-ping (no persistence)
 *   - Test:  /api/liveguard/test/session-behavior-ping (persists to
 *            liveguard_behavior_snapshots for Label Studio export)
 *
 * The backend uses the endpoint URL as the sole authority for demo-vs-test
 * classification — the client-supplied isDemo flag is not trusted.
 *
 * Same security pattern as session-behavior-ping.ts:
 * - POST only, OPTIONS preflight
 * - Origin allowlist (no wildcard CORS)
 * - Server-side API key injection
 * - Safe error responses
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import type { IncomingMessage, ServerResponse } from 'node:http';

// ─── Types ─────────────────────────────────────────────────────────

export interface LiveGuardRequest extends IncomingMessage {
  body?: unknown;
  query?: Record<string, string | string[]>;
}

export interface LiveGuardResponse extends ServerResponse {
  status: (code: number) => LiveGuardResponse;
  json: (data: unknown) => void;
  send: (data: string | Buffer) => void;
}

// ─── Config ────────────────────────────────────────────────────────

const UPSTREAM_TIMEOUT_MS = 15_000;

const DEFAULT_ALLOWED_ORIGINS = [
  'capacitor://localhost',
  'https://localhost',
  'http://localhost:5173',
  'http://localhost:3001',
  'https://liveguard-topaz.vercel.app',
  'https://liveguards.app',
  'https://www.liveguards.app',
  'https://secure.liveguards.app',
];

const VERCEL_PREVIEW_PATTERN = /^https:\/\/liveguard-[a-z0-9-]+\.vercel\.app$/;

function getAllowedOrigins(): Set<string> {
  const set = new Set<string>(DEFAULT_ALLOWED_ORIGINS);
  const envOrigins = process.env.LIVEGUARD_ALLOWED_ORIGINS || process.env.PAYGUARD_ALLOWED_ORIGINS;
  if (envOrigins) {
    for (const o of envOrigins.split(',')) {
      const trimmed = o.trim();
      if (trimmed) set.add(trimmed);
    }
  }
  return set;
}

function getUpstreamUrl(): string {
  // Route through the Cloudflare Worker (/hv/* prefix), same as the demo proxy.
  // The /test/ path is preserved so the backend can distinguish test pings.
  const base = process.env.HYBRID_VECTOR_API_URL || 'https://api.hcs-u7.org/hv';
  return `${base.replace(/\/+$/, '')}/api/liveguard/test/session-behavior-ping`;
}

function getClientIp(req: LiveGuardRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string') return fwd.split(',')[0].trim();
  if (Array.isArray(fwd) && fwd.length > 0) return fwd[0].trim();
  return req.socket?.remoteAddress ?? 'unknown';
}

function isCapacitorRequest(req: LiveGuardRequest): boolean {
  const ua = req.headers['user-agent'] ?? '';
  const origin = req.headers.origin ?? '';
  return (
    ua.toLowerCase().includes('capacitor') ||
    origin.startsWith('capacitor://') ||
    origin === 'https://localhost'
  );
}

function safeLog(level: 'info' | 'warn' | 'error', fields: Record<string, unknown>): void {
  const line = JSON.stringify(fields);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

// ─── Main handler ──────────────────────────────────────────────────

export default async function liveguardTestBehaviorPingHandler(
  req: LiveGuardRequest,
  res: LiveGuardResponse,
): Promise<void> {
  const startTime = Date.now();
  const ip = getClientIp(req);
  const origin = (req.headers.origin ?? '') as string;

  // ── CORS ──
  if (origin) {
    const allowed = getAllowedOrigins();
    if (allowed.has(origin) || VERCEL_PREVIEW_PATTERN.test(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Access-Control-Max-Age', '86400');
    } else {
      safeLog('warn', { msg: 'CORS_ORIGIN_DENIED', origin, ip });
      res.status(403).json({ ok: false, error: 'Origin not allowed' });
      return;
    }
  } else if (!isCapacitorRequest(req)) {
    safeLog('warn', { msg: 'CORS_NO_ORIGIN', ip });
    res.status(403).json({ ok: false, error: 'Origin header required' });
    return;
  }

  // ── OPTIONS preflight ──
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // ── POST only ──
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Only POST is supported' });
    return;
  }

  // ── Parse JSON safely ──
  let body: Record<string, unknown>;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {}) as Record<string, unknown>;
  } catch {
    res.status(400).json({ ok: false, error: 'Invalid JSON' });
    return;
  }

  // ── Validate required sessionId ──
  const sessionId = body.sessionId;
  if (!sessionId || typeof sessionId !== 'string') {
    res.status(400).json({ ok: false, error: 'sessionId is required' });
    return;
  }

  // ── API key (server-side only) ──
  const apiKey = process.env.HV_API_KEY;
  if (!apiKey) {
    safeLog('error', { msg: 'CONFIG_ERROR', reason: 'HV_API_KEY not set' });
    res.status(500).json({ ok: false, error: 'Server misconfigured' });
    return;
  }

  // ── Forward to upstream ──
  const targetUrl = getUpstreamUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'X-Source-App': 'liveguard',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const durationMs = Date.now() - startTime;

    safeLog('info', {
      msg: 'test_behavior_ping_proxy_ok',
      status: upstreamRes.status,
      durationMs,
      sessionId,
    });

    let upstreamData: unknown;
    try {
      upstreamData = await upstreamRes.json();
    } catch {
      res.status(502).json({ ok: false, error: 'Behavior ping unavailable' });
      return;
    }

    res.status(upstreamRes.status).json(upstreamData);
  } catch (err) {
    clearTimeout(timeout);
    const isAbort = err instanceof Error && err.name === 'AbortError';
    safeLog('error', {
      msg: isAbort ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_ERROR',
      durationMs: Date.now() - startTime,
      sessionId,
    });
    res.status(502).json({ ok: false, error: 'Behavior ping unavailable' });
  }
}
