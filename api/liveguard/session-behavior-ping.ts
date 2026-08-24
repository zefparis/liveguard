/**
 * LiveGuard — Behavior ping proxy (Vercel serverless function)
 *
 * POST /api/liveguard/session-behavior-ping
 *
 * Forwards behavioral telemetry pings from the LiveGuard demo client
 * to the hybrid-vector-api backend. Same security pattern as verify.ts:
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

// 15s — matches the client BEACON_TIMEOUT_MS and the verify.ts proxy timeout.
// The upstream Worker + hybrid-vector-api chain can take 5-8s, especially on
// cold starts. The previous 10s was too tight when combined with Vercel cold start.
const UPSTREAM_TIMEOUT_MS = 15_000;

const DEFAULT_ALLOWED_ORIGINS = [
  'capacitor://localhost',
  'https://localhost',
  'http://localhost:5173',
  'http://localhost:3001',
  'https://liveguard-topaz.vercel.app',
  // LiveGuard custom production domain (liveguards.app)
  'https://liveguards.app',
  'https://www.liveguards.app',
  // HCS-U7 protected proxy subdomain for liveguards.app
  'https://secure.liveguards.app',
];

const VERCEL_PREVIEW_PATTERN = /^https:\/\/liveguard-[a-z0-9-]+\.vercel\.app$/;

function getAllowedOrigins(): Set<string> {
  const set = new Set<string>(DEFAULT_ALLOWED_ORIGINS);
  // Support both LIVEGUARD_ALLOWED_ORIGINS (canonical) and PAYGUARD_ALLOWED_ORIGINS
  // (legacy name from when the app was called PayGuard) for backward compat.
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
  // STEP 4 MIGRATION: route through the Cloudflare Worker (/hv/* prefix)
  // instead of calling hybrid-vector-api directly on Render.
  // The Worker applies WAF, rate limiting, bot detection, and injects
  // X-HCS-Worker-Auth + x-origin-verify + X-Behavioral-Risk-Score.
  // The /hv prefix is stripped by the Worker before forwarding to the upstream.
  //
  // IMPORTANT: the hybrid-vector-api mounts liveguard routes under /api
  // (app.use('/api', liveguardBehaviorPingRouter)), so we must include /api
  // in the path after the /hv prefix. The Worker strips /hv → /api/liveguard/...
  const base = process.env.HYBRID_VECTOR_API_URL || 'https://api.hcs-u7.org/hv';
  return `${base.replace(/\/+$/, '')}/api/liveguard/session-behavior-ping`;
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

export default async function liveguardBehaviorPingHandler(
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
      msg: 'behavior_ping_proxy_ok',
      status: upstreamRes.status,
      durationMs,
      sessionId,
    });

    // ── Parse and forward upstream response ──
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
