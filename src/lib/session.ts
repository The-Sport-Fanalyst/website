/**
 * Minimal stateless sessions.
 *
 * A session is a small JSON blob (the GitHub identity we care about) encoded and
 * signed with HMAC-SHA256 using SESSION_SECRET. We never trust a cookie we can't
 * verify the signature on, so tampering is detected. No database needed: the
 * cookie *is* the session.
 *
 * The GitHub access token is intentionally NOT stored in the cookie. We use it
 * once during the callback to fetch the profile, then drop it. If you later need
 * to act on the user's behalf (open PRs as them), store it server-side keyed by
 * session id instead of in the cookie.
 */
import crypto from 'node:crypto';
import type { Role } from './roles';

export const SESSION_COOKIE = 'tsf_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days

export interface SessionUser {
  login: string;
  name: string | null;
  avatar: string;
  profileUrl: string;
  role: Role;
  iat: number; // issued-at (unix seconds)
}

function secret(): string {
  const s = import.meta.env.SESSION_SECRET || process.env.SESSION_SECRET;
  if (!s) {
    throw new Error(
      'SESSION_SECRET is not set. Add it to your .env (see .env.example).'
    );
  }
  return s;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function b64urlDecode(input: string): Buffer {
  input = input.replace(/-/g, '+').replace(/_/g, '/');
  while (input.length % 4) input += '=';
  return Buffer.from(input, 'base64');
}

function sign(payload: string): string {
  return b64url(crypto.createHmac('sha256', secret()).update(payload).digest());
}

/** Serialize + sign a session into a cookie value. */
export function encodeSession(user: SessionUser): string {
  const payload = b64url(JSON.stringify(user));
  return `${payload}.${sign(payload)}`;
}

/** Verify + parse a cookie value back into a session, or null if invalid. */
export function decodeSession(value: string | undefined | null): SessionUser | null {
  if (!value) return null;
  const [payload, mac] = value.split('.');
  if (!payload || !mac) return null;

  const expected = sign(payload);
  // constant-time compare
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const user = JSON.parse(b64urlDecode(payload).toString()) as SessionUser;
    if (!user.login) return null;
    if (Date.now() / 1000 - user.iat > MAX_AGE_SECONDS) return null; // expired
    return user;
  } catch {
    return null;
  }
}

const isProd = import.meta.env.PROD;

export function sessionCookieAttributes(value: string, maxAge = MAX_AGE_SECONDS): string {
  const parts = [
    `${SESSION_COOKIE}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (isProd) parts.push('Secure');
  return parts.join('; ');
}

export function clearSessionCookie(): string {
  return sessionCookieAttributes('', 0);
}

/** Short-lived signed cookie used to carry the OAuth `state` value (CSRF guard). */
export const OAUTH_STATE_COOKIE = 'tsf_oauth_state';

export function stateCookie(value: string): string {
  const parts = [
    `${OAUTH_STATE_COOKIE}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=600', // 10 minutes
  ];
  if (isProd) parts.push('Secure');
  return parts.join('; ');
}

export function clearStateCookie(): string {
  return [`${OAUTH_STATE_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'].join('; ');
}

/** Short-lived cookie remembering where to send the user after login. */
export const OAUTH_NEXT_COOKIE = 'tsf_oauth_next';

export function nextCookie(value: string): string {
  const parts = [
    `${OAUTH_NEXT_COOKIE}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=600',
  ];
  if (isProd) parts.push('Secure');
  return parts.join('; ');
}

export function clearNextCookie(): string {
  return [`${OAUTH_NEXT_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'].join('; ');
}
