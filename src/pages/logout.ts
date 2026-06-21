import type { APIRoute } from 'astro';
import { clearSessionCookie } from '../lib/session';

export const prerender = false;

const bye = (ctx: Parameters<APIRoute>[0]) =>
  new Response(null, {
    status: 302,
    headers: { Location: '/', 'Set-Cookie': clearSessionCookie() },
  });

export const GET: APIRoute = bye;
export const POST: APIRoute = bye;
