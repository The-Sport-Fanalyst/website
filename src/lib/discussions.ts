/**
 * GitHub Discussions wiring for the Community Board.
 *
 * The board is a window into GitHub Discussions: each board category maps to a
 * Discussions category, and links deep-link into GitHub where the conversation
 * lives. GitHub provides threading, replies, identity, moderation, and
 * notifications — no database needed.
 *
 * Which repo hosts Discussions is configurable. By default it's the content repo
 * (CONTENT_REPO), but you can point it elsewhere (e.g. a dedicated community repo)
 * with the DISCUSSIONS_REPO env var.
 */
import { CONTENT_REPO } from './content-repo';

function env(key: string): string | undefined {
  return (import.meta.env as Record<string, string>)[key] || process.env?.[key];
}

/** owner/repo that has Discussions enabled. */
export const DISCUSSIONS_REPO = env('DISCUSSIONS_REPO') || CONTENT_REPO;

const base = `https://github.com/${DISCUSSIONS_REPO}/discussions`;

export type BoardType = 'Open Project' | 'Research Question' | 'Data Request' | 'Discussion';

/**
 * Maps each board type to its GitHub Discussions category slug.
 *
 * IMPORTANT: these slugs must match the category names you create in the repo's
 * Discussions settings. GitHub slugs are lowercased with spaces as hyphens.
 * Defaults below assume you create categories named:
 *   "Open Projects", "Research", "Data Requests", "General"
 * Override any of them via env if you name them differently.
 */
export const DISCUSSION_CATEGORY: Record<BoardType, string> = {
  'Open Project': env('DISC_CAT_OPEN_PROJECTS') || 'open-projects',
  'Research Question': env('DISC_CAT_RESEARCH') || 'research',
  'Data Request': env('DISC_CAT_DATA_REQUESTS') || 'data-requests',
  'Discussion': env('DISC_CAT_GENERAL') || 'general',
};

/** URL listing all discussions in a category. */
export function categoryUrl(type: BoardType): string {
  return `${base}/categories/${DISCUSSION_CATEGORY[type]}`;
}

/** URL to browse all discussions. */
export const allDiscussionsUrl = base;

/**
 * URL that opens GitHub's "new discussion" composer, pre-filled.
 * GitHub supports ?category=<slug>&title=<t>&body=<b> on the /new path.
 */
export function newDiscussionUrl(opts: {
  type: BoardType;
  title?: string;
  body?: string;
}): string {
  const params = new URLSearchParams({ category: DISCUSSION_CATEGORY[opts.type] });
  if (opts.title) params.set('title', opts.title);
  if (opts.body) params.set('body', opts.body);
  return `${base}/new?${params.toString()}`;
}

// ── Build-time fetch of real discussions ──────────────────────────────────
//
// Reads discussions from GitHub's GraphQL API at build time so the board can
// list real threads (and link straight to them). Requires a token in the
// GITHUB_DISCUSSIONS_TOKEN env var (read-only Discussions scope). If the token
// is absent or GitHub is unreachable, returns [] so the build never fails — the
// board simply shows its empty state until the next successful build.

export interface DiscussionItem {
  number: number;
  title: string;
  url: string;
  category: string; // category name as on GitHub
  author: string | null;
  avatar: string | null;
  createdAt: string;
  comments: number;
  excerpt: string;
}

function token(): string | undefined {
  return env('GITHUB_DISCUSSIONS_TOKEN') || env('GITHUB_TOKEN');
}

export function discussionsConfigured(): boolean {
  return Boolean(token());
}

export async function fetchDiscussions(limit = 50): Promise<DiscussionItem[]> {
  const t = token();
  if (!t) return [];
  const [owner, repo] = DISCUSSIONS_REPO.split('/');
  if (!owner || !repo) return [];

  const query = `
    query($owner:String!, $repo:String!, $limit:Int!) {
      repository(owner:$owner, name:$repo) {
        discussions(first:$limit, orderBy:{field:UPDATED_AT, direction:DESC}) {
          nodes {
            number title url createdAt
            bodyText
            comments { totalCount }
            category { name }
            author { login avatarUrl }
          }
        }
      }
    }`;

  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${t}`,
        'Content-Type': 'application/json',
        'User-Agent': 'the-sport-fanalyst',
      },
      body: JSON.stringify({ query, variables: { owner, repo, limit } }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.warn(`[discussions] GitHub API ${res.status} — board will show empty state.`);
      return [];
    }
    const json: any = await res.json();
    const nodes = json?.data?.repository?.discussions?.nodes ?? [];
    return nodes.map((n: any): DiscussionItem => ({
      number: n.number,
      title: n.title,
      url: n.url,
      category: n.category?.name ?? '',
      author: n.author?.login ?? null,
      avatar: n.author?.avatarUrl ?? null,
      createdAt: n.createdAt,
      comments: n.comments?.totalCount ?? 0,
      excerpt: (n.bodyText ?? '').replace(/\s+/g, ' ').slice(0, 160).trim(),
    }));
  } catch (err) {
    console.warn('[discussions] fetch failed — board will show empty state.', err);
    return [];
  }
}

/** Map a GitHub category NAME back to our BoardType (best-effort by slug). */
export function boardTypeForCategory(categoryName: string): BoardType | null {
  const slug = categoryName.toLowerCase().replace(/\s+/g, '-');
  const entry = (Object.entries(DISCUSSION_CATEGORY) as [BoardType, string][])
    .find(([, s]) => s === slug);
  return entry ? entry[0] : null;
}
