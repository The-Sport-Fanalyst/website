/**
 * Role model for The Sport Fanalyst.
 *
 * Phase 2 keeps "GitHub is the source of truth" literal: identity comes from
 * GitHub, and a person's role is decided by this allow-list. Anyone who logs in
 * but isn't listed here is a Member by default — they can comment, join projects,
 * and submit ideas, but not approve or manage.
 *
 * In a later pass this list can move into a repo file (e.g. a roles.yml in the
 * org's .github repo) so role changes themselves go through pull-request review.
 * For now it lives in code and is read at request time.
 */

export type Role = 'Admin' | 'Maintainer' | 'Contributor' | 'Member';

export const ROLE_RANK: Record<Role, number> = {
  Member: 1,
  Contributor: 2,
  Maintainer: 3,
  Admin: 4,
};

/** GitHub login (lowercased) -> role. Edit this to promote people. */
const ROLE_BY_LOGIN: Record<string, Role> = {
  // Founder — full control of the platform.
  selinalytics: 'Admin',
  // Add maintainers/contributors here by GitHub login, e.g.:
  //   somemaintainer: 'Maintainer',
};

/** Everyone who signs in and isn't listed above gets this. */
export const DEFAULT_ROLE: Role = 'Member';

export function roleForLogin(login: string | undefined | null): Role {
  if (!login) return DEFAULT_ROLE;
  return ROLE_BY_LOGIN[login.toLowerCase()] ?? DEFAULT_ROLE;
}

/** True if `role` is at least as privileged as `min`. */
export function hasRole(role: Role, min: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

export const ROLE_ABILITIES: Record<Role, string[]> = {
  Member: ['Create a profile', 'Comment', 'Join projects', 'Submit ideas'],
  Contributor: ['Submit projects', 'Create content', 'Update pages'],
  Maintainer: ['Review submissions', 'Manage sport sections'],
  Admin: ['Full control', 'Founder'],
};
