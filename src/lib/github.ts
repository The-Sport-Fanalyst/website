/**
 * GitHub OAuth — the only part of Phase 2 that needs a server secret.
 *
 * Flow:
 *   1. /login          -> redirect user to GitHub authorize URL (with CSRF `state`)
 *   2. GitHub          -> user consents, redirects back to /auth/callback?code&state
 *   3. /auth/callback  -> exchange `code` for an access token (needs CLIENT_SECRET),
 *                         fetch the GitHub profile, mint our session cookie.
 *
 * If you stay on GitHub Pages (no server), only steps 2->3's token exchange must
 * move to a tiny external worker; the rest of the app is unaffected.
 */
import crypto from 'node:crypto';

const AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const TOKEN_URL = 'https://github.com/login/oauth/access_token';
const API_USER_URL = 'https://api.github.com/user';

function env(key: string): string | undefined {
  return (import.meta.env as Record<string, string>)[key] || process.env[key];
}

export function isConfigured(): boolean {
  return Boolean(env('GITHUB_CLIENT_ID') && env('GITHUB_CLIENT_SECRET'));
}

/** Random opaque value to defend the callback against CSRF. */
export function newState(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function authorizeUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: env('GITHUB_CLIENT_ID') || '',
    redirect_uri: redirectUri,
    scope: 'read:user', // just identity; no repo write in this slice
    state,
    allow_signup: 'true',
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: env('GITHUB_CLIENT_ID'),
      client_secret: env('GITHUB_CLIENT_SECRET'),
      code,
      redirect_uri: redirectUri,
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  const data = (await res.json()) as { access_token?: string; error?: string };
  if (data.error || !data.access_token) {
    throw new Error(`Token exchange error: ${data.error ?? 'no token returned'}`);
  }
  return data.access_token;
}

export interface GitHubProfile {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
}

export async function fetchProfile(token: string): Promise<GitHubProfile> {
  const res = await fetch(API_USER_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'the-sport-fanalyst',
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Profile fetch failed: ${res.status}`);
  return (await res.json()) as GitHubProfile;
}

/** Public (unauthenticated) lookup — used to enrich a contributor page. */
export async function fetchPublicProfile(login: string): Promise<GitHubProfile | null> {
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(login)}`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'the-sport-fanalyst' },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    return (await res.json()) as GitHubProfile;
  } catch {
    // GitHub unreachable/slow — enrichment is optional, never block the page.
    return null;
  }
}
