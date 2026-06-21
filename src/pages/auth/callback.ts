import type { APIRoute } from 'astro';
import { exchangeCodeForToken, fetchProfile } from '../../lib/github';
import {
  encodeSession,
  sessionCookieAttributes,
  clearStateCookie,
  clearNextCookie,
  OAUTH_STATE_COOKIE,
  OAUTH_NEXT_COOKIE,
  type SessionUser,
} from '../../lib/session';
import { roleForLogin } from '../../lib/roles';

export const prerender = false;

function cleanup() {
  const h = new Headers();
  h.append('Set-Cookie', clearStateCookie());
  h.append('Set-Cookie', clearNextCookie());
  return h;
}

export const GET: APIRoute = async (ctx) => {
  const url = new URL(ctx.request.url);
  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  const cookieState = ctx.cookies.get(OAUTH_STATE_COOKIE)?.value;

  // CSRF: the random state GitHub echoed back must match the one in our cookie.
  if (!code || !returnedState || !cookieState || returnedState !== cookieState) {
    const headers = cleanup();
    headers.set('Content-Type', 'text/plain');
    return new Response('Invalid OAuth state. Please try signing in again.', {
      status: 400,
      headers,
    });
  }

  // Where to go after login was stored separately; default to /me. Only allow
  // same-site paths to avoid open-redirects.
  const rawNext = ctx.cookies.get(OAUTH_NEXT_COOKIE)?.value;
  const decoded = rawNext ? decodeURIComponent(rawNext) : '/me';
  const next = decoded.startsWith('/') ? decoded : '/me';

  try {
    const redirectUri = new URL('/auth/callback', ctx.url.origin).toString();
    const token = await exchangeCodeForToken(code, redirectUri);
    const profile = await fetchProfile(token);
    // token is now discarded — we only needed identity for this slice.

    const user: SessionUser = {
      login: profile.login,
      name: profile.name,
      avatar: profile.avatar_url,
      profileUrl: profile.html_url,
      role: roleForLogin(profile.login),
      iat: Math.floor(Date.now() / 1000),
    };

    const headers = cleanup();
    headers.append('Set-Cookie', sessionCookieAttributes(encodeSession(user)));
    headers.set('Location', next);

    return new Response(null, { status: 302, headers });
  } catch (err) {
    const headers = cleanup();
    headers.set('Content-Type', 'text/plain');
    return new Response(
      `Sign-in failed: ${err instanceof Error ? err.message : 'unknown error'}`,
      { status: 502, headers }
    );
  }
};
