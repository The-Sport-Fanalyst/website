/// <reference path="../.astro/types.d.ts" />

import type { SessionUser } from './lib/session';

declare global {
  namespace App {
    interface Locals {
      user: SessionUser | null;
    }
  }
}

interface ImportMetaEnv {
  readonly GITHUB_CLIENT_ID: string;
  readonly GITHUB_CLIENT_SECRET: string;
  readonly SESSION_SECRET: string;
  readonly SITE_URL: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export {};
