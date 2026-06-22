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

export const collections = { sports, projects, community, contributors };
