/**
 * Project links.
 *
 * Projects don't all live on GitHub — plenty live in Kaggle notebooks, Tableau
 * Public dashboards, Colab, Hugging Face, etc. Rather than adding a new
 * `kaggle_url`, `tableau_url`, ... field forever, projects carry a `links`
 * array of { type, label?, url }. The legacy `github_url` / `demo_url` fields
 * still work and are folded in here, so old content keeps rendering.
 *
 * SECURITY NOTE: we never accept raw HTML/iframe markup from contributors.
 * Embeds are built by us from a URL that has been validated against an
 * allowlist of hosts. See `tableauEmbed()`.
 */

export type LinkType =
  | 'repo'
  | 'notebook'
  | 'dashboard'
  | 'dataset'
  | 'demo'
  | 'article'
  | 'other';

export interface ProjectLink {
  type: LinkType;
  label?: string;
  url: string;
}

export interface ResolvedLink extends ProjectLink {
  /** Human platform name, e.g. "Kaggle". */
  platform: string;
  /** Button text, e.g. "View on Kaggle". */
  text: string;
  /** True when this is the main/primary action for the project. */
  primary: boolean;
}

/** Only ever allow real web links. Blocks javascript:, data:, etc. */
export function safeUrl(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const value = raw.trim();
  if (!value) return undefined;
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return undefined;
    return u.href;
  } catch {
    return undefined;
  }
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

/** host suffix -> [platform name, default verb] */
const PLATFORMS: Array<[string, string, string]> = [
  ['github.com', 'GitHub', 'View on'],
  ['gitlab.com', 'GitLab', 'View on'],
  ['kaggle.com', 'Kaggle', 'View on'],
  ['public.tableau.com', 'Tableau', 'Open in'],
  ['tableau.com', 'Tableau', 'Open in'],
  ['colab.research.google.com', 'Colab', 'Open in'],
  ['huggingface.co', 'Hugging Face', 'View on'],
  ['observablehq.com', 'Observable', 'View on'],
  ['deepnote.com', 'Deepnote', 'Open in'],
  ['streamlit.app', 'Streamlit', 'Open'],
  ['shinyapps.io', 'Shiny', 'Open'],
  ['posit.cloud', 'Posit', 'Open in'],
  ['docs.google.com', 'Google Docs', 'Open in'],
  ['drive.google.com', 'Google Drive', 'Open in'],
  ['datawrapper.de', 'Datawrapper', 'View on'],
  ['flourish.studio', 'Flourish', 'View on'],
  ['powerbi.com', 'Power BI', 'Open in'],
  ['zenodo.org', 'Zenodo', 'View on'],
  ['figshare.com', 'Figshare', 'View on'],
  ['data.world', 'data.world', 'View on'],
  ['medium.com', 'Medium', 'Read on'],
  ['substack.com', 'Substack', 'Read on'],
];

const TYPE_FALLBACK: Record<LinkType, string> = {
  repo: 'View repository',
  notebook: 'Open notebook',
  dashboard: 'Open dashboard',
  dataset: 'View dataset',
  demo: 'Open demo',
  article: 'Read the write-up',
  other: 'Open link',
};

/** Which link should be the highlighted primary button. */
const TYPE_RANK: Record<LinkType, number> = {
  dashboard: 0,
  notebook: 1,
  repo: 2,
  demo: 3,
  dataset: 4,
  article: 5,
  other: 6,
};

export function platformOf(url: string): string | undefined {
  const host = hostOf(url);
  if (!host) return undefined;
  for (const [suffix, name] of PLATFORMS) {
    if (host === suffix || host.endsWith(`.${suffix}`)) return name;
  }
  return undefined;
}

function labelFor(link: ProjectLink): string {
  if (link.label && link.label.trim()) return link.label.trim();
  const host = hostOf(link.url);
  for (const [suffix, name, verb] of PLATFORMS) {
    if (host === suffix || host.endsWith(`.${suffix}`)) return `${verb} ${name}`;
  }
  return TYPE_FALLBACK[link.type] ?? TYPE_FALLBACK.other;
}

interface LinkSource {
  links?: ProjectLink[];
  github_url?: string;
  demo_url?: string;
}

/**
 * Merge new-style `links` with legacy `github_url` / `demo_url`, drop anything
 * unsafe or duplicated, and sort so the most "primary" link comes first.
 */
export function resolveLinks(data: LinkSource): ResolvedLink[] {
  const raw: ProjectLink[] = [];

  for (const l of data.links ?? []) {
    if (l && typeof l.url === 'string') {
      raw.push({ type: (l.type ?? 'other') as LinkType, label: l.label, url: l.url });
    }
  }
  if (data.github_url) raw.push({ type: 'repo', url: data.github_url });
  if (data.demo_url) raw.push({ type: 'demo', url: data.demo_url });

  const seen = new Set<string>();
  const out: ResolvedLink[] = [];

  for (const link of raw) {
    const url = safeUrl(link.url);
    if (!url) continue;
    const key = url.replace(/\/+$/, '').toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      ...link,
      url,
      platform: platformOf(url) ?? 'Link',
      text: labelFor({ ...link, url }),
      primary: false,
    });
  }

  out.sort((a, b) => (TYPE_RANK[a.type] ?? 9) - (TYPE_RANK[b.type] ?? 9));
  if (out.length > 0) out[0].primary = true;
  return out;
}

/* ------------------------------------------------------------------ */
/* Tableau Public embedding                                            */
/* ------------------------------------------------------------------ */

/**
 * Turn a Tableau Public URL into a safe embeddable URL.
 *
 * We accept only `public.tableau.com` and build the embed ourselves, so a
 * contributor can never inject arbitrary iframe markup. Returns undefined for
 * anything else (including Tableau Server/Cloud, which needs auth anyway).
 *
 * Handles both shapes:
 *   https://public.tableau.com/app/profile/NAME/viz/BOOK/SHEET
 *   https://public.tableau.com/views/BOOK/SHEET
 */
export function tableauEmbed(rawUrl: string): string | undefined {
  const url = safeUrl(rawUrl);
  if (!url) return undefined;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }

  const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
  if (host !== 'public.tableau.com') return undefined;

  const parts = parsed.pathname.split('/').filter(Boolean);

  let book: string | undefined;
  let sheet: string | undefined;

  const vizAt = parts.indexOf('viz');
  if (vizAt !== -1 && parts.length >= vizAt + 3) {
    book = parts[vizAt + 1];
    sheet = parts[vizAt + 2];
  } else if (parts[0] === 'views' && parts.length >= 3) {
    book = parts[1];
    sheet = parts[2];
  }

  if (!book || !sheet) return undefined;

  const embed = new URL(`https://public.tableau.com/views/${book}/${sheet}`);
  embed.searchParams.set(':embed', 'y');
  embed.searchParams.set(':showVizHome', 'no');
  embed.searchParams.set(':display_count', 'no');
  embed.searchParams.set(':toolbar', 'yes');
  return embed.href;
}

/** The first embeddable Tableau viz on a project, if any. */
export function findTableau(links: ResolvedLink[]): { view: string; embed: string } | undefined {
  for (const l of links) {
    const embed = tableauEmbed(l.url);
    if (embed) return { view: l.url, embed };
  }
  return undefined;
}
