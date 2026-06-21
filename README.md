# The Sport Fanalyst — Website Shell (Phase 1)

An open, community-driven home for **Olympic & Paralympic analytics**. Flagship initiative: **LA28**.
Like GitHub for collaboration, Wikipedia for knowledge, and Kaggle for projects — pointed at the Games.

This repository is **Phase 1: the website shell and content architecture**. It is intentionally
static and content-driven. Accounts, auth, and approval tooling come in Phase 2 — GitHub remains
the source of truth for code, data, and pull requests.

## Stack

- **Astro** — content-first static site
- **Markdown content collections** — typed via Zod schemas in `src/content.config.ts`
- **No runtime dependencies** — deploys as static files (GitHub Pages or any static host)

## Run it

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs to ./dist
npm run preview  # serve the built site
```

## Structure

> **Content lives in a separate repo.** The Markdown content (`content/`) is a git
> submodule pointing at `thesportfanalyst/content`, so contributors open PRs against
> content only and content maintainers get access to just that repo. See
> `CONTENT-SETUP.md` for the one-time setup. Collection `base:` paths point at
> `content/`; a prebuild check (`scripts/check-content.mjs`) fails fast if the
> submodule isn't initialized.

```
src/
├── content.config.ts        # Zod schemas for all collections
├── content/
│   ├── sports/              # one .md per sport hub
│   ├── projects/           # one .md per project (Data/Research/Models/Apps)
│   ├── community/          # board posts (Open Project / Research Question / Data Request / Discussion)
│   └── contributors/       # people + roles
├── components/             # Header, Footer, ProjectCard
├── layouts/Base.astro      # shell: fonts, header, footer, skip-link
├── styles/global.css       # design tokens + the "lane rail" signature
└── pages/
    ├── index.astro             # homepage
    ├── sports/                 # directory + [slug] hub pages
    ├── projects/               # index (filterable) + [id] detail
    ├── community/index.astro   # community board
    ├── contributors/           # directory + [id] profile
    └── contribute.astro        # workflow, roles, permissions, templates
```

## Content model

Add content by dropping a Markdown file into the right folder. Frontmatter is validated at build time.

### Sport (`src/content/sports/<slug>.md`)
`name, slug, icon, description, olympic, paralympic, disciplines[], la28Venue?, featured, order`

### Project (`src/content/projects/<id>.md`)
`title, creator, sport, category (Data|Research|Models|Apps), description, status,
github_url?, demo_url?, data_sources[], contributors[], created_date, featured, games (Summer|Winter|Paralympic)`

Each project page surfaces **provenance** (author, sources, methodology) — the trust standard every analysis must meet.

### Community post (`src/content/community/<id>.md`)
`title, type (Open Project|Research Question|Data Request|Discussion), sport?, author,
description, skills_needed[], status, contributors[], posted_date`

### Contributor (`src/content/contributors/<id>.md`)
`name, handle, role (Admin|Maintainer|Contributor|Member), bio, avatar_initials, github?, focus[], joined`

## Roles & permissions

| Role | Can |
|------|-----|
| Visitor | browse sports, view projects, read stories |
| Member | create profile, comment, join projects, submit ideas |
| Contributor | submit projects, create content, update pages |
| Maintainer | review submissions, manage sport sections |
| Admin | full control (founder) |

The permission model is documented on `/contribute` and rendered from data — Phase 2 wires it to real auth.

## Design

The visual identity is built on a **stadium-lane** motif: the repeating chartreuse / brick / slate
"lane rail" divider, monospace data labels that read like a stats sheet, and a warm-paper canvas.
Palette and type tokens live at the top of `src/styles/global.css`.

## Roadmap

- **Phase 1 (this repo):** website shell, content architecture, contribution model — done
- **Phase 2:** accounts, GitHub auth, contributor profiles, submissions, moderation

---

Community project. Not affiliated with the IOC or LA28.

---

## Phase 2 — GitHub sign-in & contributor profiles (implemented)

Phase 2 adds **real GitHub OAuth login** and **profiles**, with GitHub as the identity source.

### Architecture

The site now uses Astro's **server output** with the Node adapter. Content pages
(home, sports, projects, community, contributors, contribute) are **prerendered** to
static HTML for speed; only the auth routes run on demand. The header's logged-in
state hydrates client-side from `/api/me`, so even static pages show correct auth state.

```
src/
├── middleware.ts            # attaches Astro.locals.user from the session cookie
├── env.d.ts                 # types for locals.user + env vars
├── lib/
│   ├── roles.ts             # Role model + login→role allow-list (edit to promote people)
│   ├── session.ts           # signed HTTP-only session cookies (HMAC, no deps)
│   ├── github.ts            # OAuth: authorize URL, token exchange, profile fetch
│   └── auth.ts              # request-side helpers / route guards
└── pages/
    ├── login.ts             # GET /login  → redirect to GitHub (with CSRF state)
    ├── auth/callback.ts     # GET /auth/callback → verify, mint session, redirect
    ├── logout.ts            # clears the session cookie
    ├── login/setup.astro    # shown until OAuth env vars are set
    ├── me.astro             # the signed-in user's own profile (guarded)
    └── api/me.ts            # JSON current-user, for header hydration
```

### One-time setup

1. Create a GitHub OAuth app at https://github.com/settings/developers
   - Homepage URL: `http://localhost:4321`
   - Callback URL: `http://localhost:4321/auth/callback`
2. Copy `.env.example` to `.env` and fill in:
   ```
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   SESSION_SECRET=$(openssl rand -hex 32)
   SITE_URL=http://localhost:4321
   ```
3. `npm run dev`, then visit `/login`. (Without `.env`, `/login` redirects to a
   setup guide at `/login/setup`.)

### Roles

A signed-in user's role comes from the allow-list in `src/lib/roles.ts`
(`Admin` / `Maintainer` / `Contributor` / `Member`). The founder is seeded as Admin;
everyone else defaults to Member. Edit that file to promote people — or, later, move
the list into a repo file so role changes go through PR review.

### Security notes

- Sessions are stateless signed cookies (HMAC-SHA256), `HttpOnly` + `SameSite=Lax`,
  `Secure` in production. Tampered/forged cookies are rejected.
- OAuth uses a CSRF `state` value checked on callback.
- The GitHub access token is used once to read identity, then discarded — it is
  never stored in the cookie. To later act as the user (e.g. open PRs), store the
  token server-side keyed by session id and request the needed scopes.

### Deploying

This project is configured for **Netlify** (`adapter: netlify()` in
`astro.config.mjs`, plus a `netlify.toml` pinning the build command and Node 22).
To deploy: push the repo to GitHub, import it in Netlify, register a production
GitHub OAuth app with your live callback URL, and set the four env vars in
Netlify → Site settings → Environment variables.

To run locally with a plain Node server instead, swap the adapter back to
`@astrojs/node` (`node({ mode: 'standalone' })`). For other hosts use
`@astrojs/cloudflare` or `@astrojs/vercel`. The auth code is adapter-agnostic;
only that line changes. If you must stay on GitHub Pages (static only), move just
the token exchange in `auth/callback.ts` to a small external worker.

### Next (Phase 2 cont.)

- Submission & approval workflow (issues/PRs as the backend)
- Roles file in-repo + moderation tooling
- Acting on the user's behalf (scoped tokens) for one-click submissions

---

## Phase 2 — Submission workflow (implemented)

Contributors submit projects through a **guided form** that formats their input
into a schema-valid Markdown file and opens a **GitHub pull request** for them to
confirm. Review happens in GitHub (its PR tools). The site never needs write
access to anyone's account — the final confirm is on GitHub.

### Flow

1. A logged-in user visits `/submit` (guarded; redirects to login otherwise).
2. They pick a kind (Data / Research / Model / App), fill the fields, and watch a
   live preview of the exact `.md` file build itself.
3. "Open pull request on GitHub" sends them to GitHub's new-file editor with the
   filename and content prefilled. Saving proposes it as a PR.
4. A maintainer reviews and merges in GitHub; on the next build the content appears.

### Where submissions go

Configured in `src/lib/content-repo.ts`, overridable via env vars:

```
CONTENT_REPO=thesportfanalyst/content   # default
CONTENT_BRANCH=main
```

**Recommended:** create a dedicated content repo (`thesportfanalyst/content`)
holding only the Markdown content folders, so contributors open PRs against clean
content rather than the app's source, and content maintainers can be granted access
to just that repo. Until it exists, point `CONTENT_REPO` at the app repo. The site
reads content at build time either way.

### Files

```
src/lib/content-repo.ts   # which repo/branch/paths submissions target
src/lib/submission.ts     # form input -> Markdown + prefilled PR URL (server)
src/pages/submit.astro    # guided form with live preview (client mirrors the lib)
```

Long submissions (rare) exceed GitHub's URL prefill limit; the page detects this
and offers a copy-the-Markdown fallback.

### Next

- One-click PRs via the GitHub API (needs `public_repo` scope + server-side token
  storage) if you later want to remove the final GitHub confirm step.
- In-site review queue mirroring PR status (optional; GitHub review works today).
