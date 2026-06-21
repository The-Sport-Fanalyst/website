import type { APIRoute } from 'astro';
import { authorizeUrl, isConfigured, newState } from '../lib/github';
import { stateCookie, nextCookie } from '../lib/session';

export const prerender = false;

export const GET: APIRoute = (ctx) => {
  if (!isConfigured()) {
    return ctx.redirect('/login/setup', 302);
  }

  // `state` stays a plain random token — it only needs to be unguessable so the
  // callback can confirm the round trip is legitimate (CSRF defense). We do NOT
  // pack anything else into it (that caused double-encoding mismatches).
  const state = newState();

  // Where to send the user after login is remembered in its own short cookie.
  const next = new URL(ctx.request.url).searchParams.get('next') || '/me';

  const redirectUri = new URL('/auth/callback', ctx.url.origin).toString();
  const dest = authorizeUrl(state, redirectUri);

  const headers = new Headers({ Location: dest });
  headers.append('Set-Cookie', stateCookie(state));
  headers.append('Set-Cookie', nextCookie(next));

  return new Response(null, { status: 302, headers });
};
