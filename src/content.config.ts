import { defineCollection, z, reference } from 'astro:content';
import { glob } from 'astro/loaders';

const sports = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/README.md'], base: './content/sports' }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    icon: z.string().default('●'),
    description: z.string(),
    olympic: z.boolean().default(true),
    paralympic: z.boolean().default(true),
    disciplines: z.array(z.string()).default([]),
    la28Venue: z.string().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(99),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/README.md'], base: './content/projects' }),
  schema: z.object({
    title: z.string(),
    creator: z.string(),
    sport: z.string(),
    category: z.enum(['Data', 'Research', 'Models', 'Apps']),
    description: z.string(),
    status: z.enum(['Active', 'Seeking collaborators', 'In review', 'Archived']).default('Active'),
    github_url: z.string().optional(),
    demo_url: z.string().optional(),
    // Where the work actually lives. Supports Kaggle, Tableau Public, Colab,
    // Hugging Face, etc. `github_url`/`demo_url` above still work and are
    // merged in at render time (see src/lib/links.ts).
    links: z.array(
      z.object({
        type: z.enum(['repo', 'notebook', 'dashboard', 'dataset', 'demo', 'article', 'other'])
          .default('other'),
        label: z.string().optional(),
        url: z.string(),
      })
    ).default([]),
    data_sources: z.array(
      z.union([
        z.string(),
        z.object({ name: z.string(), url: z.string().optional() }),
      ])
    ).default([]),
    contributors: z.array(z.string()).default([]),
    created_date: z.coerce.date(),
    featured: z.boolean().default(false),
    games: z.array(z.enum(['Summer', 'Winter', 'Olympic', 'Paralympic'])).default([]),
  }),
});

const community = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/README.md'], base: './content/community' }),
  schema: z.object({
    title: z.string(),
    type: z.enum(['Open Project', 'Research Question', 'Data Request', 'Discussion']),
    sport: z.string().optional(),
    author: z.string(),
    description: z.string(),
    skills_needed: z.array(z.string()).default([]),
    status: z.enum(['Open', 'Claimed', 'In progress', 'Resolved']).default('Open'),
    contributors: z.array(z.string()).default([]),
    posted_date: z.coerce.date(),
  }),
});

const contributors = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/README.md'], base: './content/contributors' }),
  schema: z.object({
    name: z.string(),
    handle: z.string(),
    role: z.enum(['Admin', 'Maintainer', 'Contributor', 'Member']),
    bio: z.string(),
    avatar_initials: z.string(),
    github: z.string().optional(),
    focus: z.array(z.string()).default([]),
    joined: z.coerce.date(),
  }),
});

// Data-focused roles across sport. We store only the metadata plus a link out —
// never the full job description (that's the employer's copyrighted text, and it
// keeps this fast to maintain).
const jobs = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/README.md'], base: './content/jobs' }),
  schema: z.object({
    title: z.string(),
    company: z.string(),
    url: z.string(),
    location: z.string().default('Not specified'),
    remote: z.boolean().default(false),
    category: z.enum([
      'Data Science',
      'Data Engineering',
      'Analytics',
      'Research',
      'Business Intelligence',
      'Other',
    ]).default('Other'),
    org_type: z.enum([
      'League',
      'Team',
      'Governing body',
      'Sports tech',
      'Media',
      'Academic',
      'Other',
    ]).default('Other'),
    employment_type: z.enum(['Full-time', 'Part-time', 'Contract', 'Internship'])
      .default('Full-time'),
    sport: z.string().optional(),
    summary: z.string().optional(),
    posted_date: z.coerce.date(),
    // Required: a listing hides itself once this date passes, so the board
    // can't fill up with dead links.
    closes: z.coerce.date(),
  }),
});

export const collections = { sports, projects, community, contributors, jobs };
