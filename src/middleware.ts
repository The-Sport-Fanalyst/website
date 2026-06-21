/**
 * Runs on every request. Decodes the session cookie once and puts the user on
 * `locals` so any page/component can read `Astro.locals.user` without re-parsing.
 */
import { defineMiddleware } from 'astro:middleware';
import { decodeSession, SESSION_COOKIE } from './lib/session';

export const onRequest = defineMiddleware((context, next) => {
  // Prerendered routes have no real request/cookies at build time. Guard so we
  // don't touch headers there (which Astro warns about). The header hydrates
  // auth state client-side via /api/me regardless.
  if (context.isPrerendered) {
    context.locals.user = null;
    return next();
  }
  const raw = context.cookies.get(SESSION_COOKIE)?.value;
  context.locals.user = decodeSession(raw);
  return next();
});
