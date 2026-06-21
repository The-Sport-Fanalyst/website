/**
 * Request-side auth helpers. Astro middleware populates `locals.user`, so pages
 * can read `Astro.locals.user` directly; these helpers are for API routes and
 * for guarding.
 */
import type { APIContext } from 'astro';
import { decodeSession, SESSION_COOKIE, type SessionUser } from './session';
import { hasRole, type Role } from './roles';

export function getUser(ctx: APIContext | { cookies: APIContext['cookies'] }): SessionUser | null {
  const raw = ctx.cookies.get(SESSION_COOKIE)?.value;
  return decodeSession(raw);
}

/** Redirect response to /login with a `next` param to return after auth. */
export function requireAuthRedirect(ctx: APIContext, next: string): Response {
  const url = `/login?next=${encodeURIComponent(next)}`;
  return ctx.redirect(url, 302);
}

export function canAccess(user: SessionUser | null, min: Role): boolean {
  return Boolean(user && hasRole(user.role, min));
}
