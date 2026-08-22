/**
 * LiveGuard — Constants
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

export const LIVEGUARD_VERSION = '1.0.0';
export const LIVEGUARD_SOURCE = 'liveguard_mobile' as const;

export const LIVEGUARD_ENABLED =
  (import.meta.env.VITE_LIVEGUARD_ENABLED as string | undefined) === 'true';

export const LIVEGUARD_API_PATH = '/api/liveguard/verify';

export const LIVEGUARD_REQUEST_TIMEOUT_MS = 10_000;

// ─── Session resolution ───────────────────────────────────────────────────
// LiveGuard uses a dedicated endpoint to distinguish its sessions from
// DemoGuard/NotABot in the cognitive_sessions table. The backend can
// route by `source` field for analytics without mixing populations.
// Falls back to a local lg_* ID on any network failure.
export const LIVEGUARD_SESSION_ENDPOINT =
  'https://hcs-u7-backend-kk0n.onrender.com/api/cognitive/liveguard/session';

// Production URL for QR code / dashboard links.
// MUST be set via VITE_LIVEGUARD_URL env var after Vercel deployment.
// No hardcoded default — liveguard.vercel.app belongs to an unrelated project.
export const LIVEGUARD_PRODUCTION_URL =
  (import.meta.env.VITE_LIVEGUARD_URL as string | undefined) || 'CONFIGURE_ME';
