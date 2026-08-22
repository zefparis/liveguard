/**
 * LiveGuard — API client
 *
 * Calls the Vercel proxy at /api/liveguard/verify.
 * NEVER calls the upstream API directly.
 * NEVER sends API keys or PII.
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { LIVEGUARD_API_PATH, LIVEGUARD_REQUEST_TIMEOUT_MS } from './constants';
import type { LiveGuardPayload, LiveGuardSafeResponse } from './types';

export class LiveGuardApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'LiveGuardApiError';
    this.status = status;
    this.code = code;
  }
}

export async function submitLiveGuard(
  payload: LiveGuardPayload,
): Promise<LiveGuardSafeResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LIVEGUARD_REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(LIVEGUARD_API_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      let code = 'HTTP_ERROR';
      let message = `LiveGuard verify failed: ${res.status}`;
      try {
        const body = (await res.json()) as { error?: string; message?: string };
        if (body.error) code = body.error;
        if (body.message) message = body.message;
      } catch {
        // body not JSON
      }
      throw new LiveGuardApiError(res.status, code, message);
    }

    return res.json() as Promise<LiveGuardSafeResponse>;
  } finally {
    clearTimeout(timer);
  }
}
