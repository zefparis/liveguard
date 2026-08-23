/**
 * Regression test: LiveGuard API CORS allowlist must include liveguards.app.
 *
 * Bug: the LiveGuard app at https://liveguards.app (custom Vercel domain)
 * called /api/liveguard/verify and /api/liveguard/session-behavior-ping
 * (relative paths → same origin). The API's DEFAULT_ALLOWED_ORIGINS only
 * listed liveguard-topaz.vercel.app, not the custom domain. The Origin
 * header "https://liveguards.app" was rejected with 403 "Origin not allowed",
 * blocking the "Vérification de session" step in production.
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * @license Patents Pending FR2514274 | FR2514546
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const API_DIR = join(process.cwd(), 'api/liveguard');

function readApi(name: string): string {
  return readFileSync(join(API_DIR, name), 'utf-8');
}

describe('LiveGuard API CORS allowlist — liveguards.app', () => {
  const files = ['verify.ts', 'session-behavior-ping.ts'];

  for (const file of files) {
    describe(`${file}`, () => {
      const src = readApi(file);

      it('includes https://liveguards.app in DEFAULT_ALLOWED_ORIGINS', () => {
        expect(src).toContain("'https://liveguards.app'");
      });

      it('includes https://secure.liveguards.app (HCS-U7 proxy subdomain)', () => {
        expect(src).toContain("'https://secure.liveguards.app'");
      });

      it('includes https://www.liveguards.app', () => {
        expect(src).toContain("'https://www.liveguards.app'");
      });

      it('still includes the original liveguard-topaz.vercel.app', () => {
        expect(src).toContain("'https://liveguard-topaz.vercel.app'");
      });

      it('still includes capacitor://localhost for mobile', () => {
        expect(src).toContain("'capacitor://localhost'");
      });

      it('supports LIVEGUARD_ALLOWED_ORIGINS env var (canonical name)', () => {
        expect(src).toContain('LIVEGUARD_ALLOWED_ORIGINS');
      });

      it('still supports PAYGUARD_ALLOWED_ORIGINS env var (legacy backward compat)', () => {
        expect(src).toContain('PAYGUARD_ALLOWED_ORIGINS');
      });

      it('produces "Origin not allowed" error message (the exact symptom)', () => {
        expect(src).toContain('Origin not allowed');
      });
    });
  }
});

describe('hcs-u7-proxy Worker — liveguards.app in CORS_ALLOWED_ORIGINS', () => {
  const proxySrc = readFileSync(
    join(process.cwd(), '..', 'hcs-u7-proxy', 'src', 'index.ts'),
    'utf-8',
  );

  it('includes https://liveguards.app', () => {
    expect(proxySrc).toContain("'https://liveguards.app'");
  });

  it('includes https://secure.liveguards.app', () => {
    expect(proxySrc).toContain("'https://secure.liveguards.app'");
  });
});
