// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

// https://astro.build/config
//
// Phase 2 uses on-demand rendering for the auth + profile routes.
// Content pages (sports, projects, etc.) are prerendered to static HTML; only
// the auth routes run on demand. The header hydrates auth state via /api/me.
//
// Deployed on Netlify. To run/deploy elsewhere, swap the adapter:
//   - Local Node server: @astrojs/node   (node({ mode: 'standalone' }))
//   - Cloudflare:        @astrojs/cloudflare
//   - Vercel:            @astrojs/vercel
// The auth code is adapter-agnostic; only this line changes.
export default defineConfig({
  output: 'server',
  adapter: netlify(),
});
