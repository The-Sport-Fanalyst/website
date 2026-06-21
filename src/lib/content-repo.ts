/**
 * Where submissions go.
 *
 * A submission becomes a pull request that adds a Markdown file to the content
 * repo. This is the ONE place that decides which repo + branch + folders.
 *
 * Recommended setup: a dedicated content repo (e.g. thesportfanalyst/content)
 * that holds only Markdown — so contributors open PRs against clean content, not
 * the app's source code, and content maintainers can be given access to just
 * this repo. Until that repo exists you can point this at the app repo instead;
 * only these values change.
 *
 * Override per-environment with env vars (e.g. in Netlify) without editing code:
 *   CONTENT_REPO=thesportfanalyst/content
 *   CONTENT_BRANCH=main
 */
function env(key: string): string | undefined {
  return (import.meta.env as Record<string, string>)[key] || process.env?.[key];
}

export const CONTENT_REPO = env('CONTENT_REPO') || 'thesportfanalyst/content';
export const CONTENT_BRANCH = env('CONTENT_BRANCH') || 'main';

/** Folder within the content repo for each kind of submission. */
export const CONTENT_PATHS = {
  project: 'projects',
  data: 'projects', // data submissions are projects with category=Data
  research: 'projects', // research submissions are projects with category=Research
  app: 'projects', // app submissions are projects with category=Apps
} as const;
