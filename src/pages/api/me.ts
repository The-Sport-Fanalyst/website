import type { APIRoute } from 'astro';

export const prerender = false;

// Returns the current user as JSON so prerendered pages can hydrate the header's
// auth state on the client. Never includes anything sensitive — just the public
// identity already shown in the UI.
export const GET: APIRoute = ({ locals }) => {
  const user = locals.user;
  return new Response(JSON.stringify({ user }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
};
