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
