/**
 * Turns a guided submission into (1) a valid Markdown file matching the content
 * schema and (2) a GitHub "create new file" URL that pre-fills the content and
 * opens a pull request. The site never needs write access — the final confirm
 * happens on GitHub, where review also lives.
 *
 * GitHub supports prefilling its new-file editor via query params:
 *   https://github.com/{repo}/new/{branch}?filename=...&value=...
 * When the user saves, GitHub offers to propose the change as a PR.
 */
import { CONTENT_REPO, CONTENT_BRANCH, CONTENT_PATHS } from './content-repo';

export type SubmissionKind = 'project' | 'data' | 'research' | 'app';

export interface SubmissionInput {
  kind: SubmissionKind;
  title: string;
  creator: string; // contributor display name
  sport: string;
  description: string;
  github_url?: string;
  demo_url?: string;
  data_sources?: string[];
  season?: 'Summer' | 'Winter';
  gtype?: 'Olympics' | 'Paralympics';
  // research / app extras captured into the body
  methodology?: string;
  notes?: string;
}

const CATEGORY_BY_KIND: Record<SubmissionKind, 'Data' | 'Research' | 'Models' | 'Apps'> = {
  project: 'Models', // generic project defaults to Models; user can change in PR
  data: 'Data',
  research: 'Research',
  app: 'Apps',
};

/** kebab-case a title into a filename stem. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'submission';
}

function yamlList(items: string[]): string {
  if (items.length === 0) return '[]';
  return `[${items.map((i) => JSON.stringify(i)).join(', ')}]`;
}

/** Build the Markdown file (frontmatter + body) for a submission. */
export function buildMarkdown(input: SubmissionInput): string {
  const category = CATEGORY_BY_KIND[input.kind];
  const today = new Date().toISOString().slice(0, 10);
  const games: string[] = [];
  if (input.season) games.push(input.season);
  if (input.gtype) games.push(input.gtype);

  const fm: string[] = [
    '---',
    `title: ${JSON.stringify(input.title)}`,
    `creator: ${JSON.stringify(input.creator)}`,
    `sport: ${JSON.stringify(input.sport)}`,
    `category: ${category}`,
    `description: ${JSON.stringify(input.description)}`,
    `status: In review`,
    input.github_url ? `github_url: ${JSON.stringify(input.github_url)}` : null,
    input.demo_url ? `demo_url: ${JSON.stringify(input.demo_url)}` : null,
    `data_sources: ${yamlList(input.data_sources ?? [])}`,
    `contributors: []`,
    `created_date: ${today}`,
    `featured: false`,
    `games: ${yamlList(games)}`,
    '---',
    '',
  ].filter(Boolean) as string[];

  const body: string[] = [`## Overview`, '', input.description, ''];
  if (input.methodology) body.push('## Methodology', '', input.methodology, '');
  if (input.notes) body.push('## Notes', '', input.notes, '');
  body.push(
    '## Provenance',
    '',
    `- **Author:** ${input.creator}`,
    `- **Data sources:** ${(input.data_sources ?? []).join(', ') || '—'}`,
    ''
  );

  return fm.join('\n') + body.join('\n');
}

export interface PreparedSubmission {
  filename: string; // path within the repo
  markdown: string;
  prUrl: string; // GitHub create-new-file URL (opens a PR on save)
  tooLong: boolean; // GitHub URL length guard
}

/** Prepare everything the UI needs to show + link to GitHub. */
export function prepareSubmission(input: SubmissionInput): PreparedSubmission {
  const folder = CONTENT_PATHS[input.kind];
  const filename = `${folder}/${slugify(input.title)}.md`;
  const markdown = buildMarkdown(input);

  const params = new URLSearchParams({
    filename,
    value: markdown,
    message: `Add ${input.kind}: ${input.title}`,
    description: `Submitted via The Sport Fanalyst by ${input.creator}.`,
  });
  const prUrl = `https://github.com/${CONTENT_REPO}/new/${CONTENT_BRANCH}?${params.toString()}`;

  // GitHub's prefill works well under ~8k chars; beyond that the URL can be
  // truncated, so the UI should fall back to copy-paste.
  const tooLong = prUrl.length > 8000;

  return { filename, markdown, prUrl, tooLong };
}
