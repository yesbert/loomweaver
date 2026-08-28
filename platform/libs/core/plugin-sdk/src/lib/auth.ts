/**
 * Auth-aware, declarative access gating. LoomWeaver owns **none** of authentication —
 * login, session, tokens, IdP integration live in the product. The platform only *reacts* to a
 * session snapshot a distribution supplies, so chrome can hide/disable itself by login state and
 * roles. Roles/claims are **opaque strings**: the platform matches, never interprets.
 *
 * Client-side gating is **presentation, not security** — the real enforcement is server-side (the
 * product BFF rejects unauthorized calls). Never treat a hidden control as a boundary.
 */

/** A user/session snapshot the host reacts to. Provider-neutral (OIDC/custom/anything reduces here). */
export interface AuthSnapshot {
  /** Whether someone is signed in. */
  readonly authenticated: boolean;
  /** Opaque role tokens held by the current principal (empty when anonymous). */
  readonly roles: readonly string[];
  /**
   * Free-form claim bag; values are strings or string lists. It stays in the distribution's own
   * code: **no plugin receives it** — a plugin permitted the session is told `authenticated` and
   * `roles`, and nothing else — and **no access requirement evaluates it**, since the host matches
   * on `authenticated` and `roles` only. Read it from your own composition; do not expect it to
   * reach a plugin or to gate anything.
   */
  readonly claims: Readonly<Record<string, string | readonly string[]>>;
  /**
   * Optional stable subject id — the **identity anchor**: the shell's identity-change
   * policy (`provideAuthSource(..., { onIdentityChange })`) compares it across snapshots, and an
   * identity-scoped settings store namespaces per-user state by it. Set it whenever the product
   * can name the signed-in principal; encode the tenant into it if tenant switches should count
   * as identity changes. Omit it and both features stay inert.
   */
  readonly subject?: string;
  /** Optional, display-only human name. */
  readonly displayName?: string;
}

/** The anonymous baseline — the bare-platform default (nobody signed in). */
export const ANONYMOUS: AuthSnapshot = { authenticated: false, roles: [], claims: {} };

/**
 * How a contribution reacts to the auth state. Intentionally **coarse** — no expression parser
 * (consistent with the `when` filter). Generic claim matching is the documented extension
 * once a real case appears (YAGNI).
 */
export interface AccessRequirement {
  /** Require a specific signed-in state (`true` = must be signed in, `false` = only anonymous). */
  readonly authenticated?: boolean;
  /** Require at least one of these roles. */
  readonly anyRole?: readonly string[];
  /** Require all of these roles. */
  readonly allRoles?: readonly string[];
  /**
   * Effect on a chrome item when the requirement is **unmet**: `hide` (default) removes it, `disable`
   * keeps it visible but inert. Routes/commands block on invoke regardless of this flag.
   */
  readonly mode?: 'hide' | 'disable';
}

/** True when `snapshot` satisfies `access`. An undefined requirement is always allowed. */
export function meetsAccess(
  access: AccessRequirement | undefined,
  snapshot: AuthSnapshot,
): boolean {
  if (!access) return true;
  if (access.authenticated !== undefined && access.authenticated !== snapshot.authenticated) {
    return false;
  }
  const held = new Set(snapshot.roles);
  if (access.anyRole?.length && !access.anyRole.some((role) => held.has(role))) return false;
  if (access.allRoles?.length && !access.allRoles.every((role) => held.has(role))) return false;
  return true;
}

/** Whether a chrome item should render at all: unmet + `hide` (the default) → not visible. */
export function isAccessVisible(
  access: AccessRequirement | undefined,
  snapshot: AuthSnapshot,
): boolean {
  return meetsAccess(access, snapshot) || access?.mode === 'disable';
}

/** Whether a rendered chrome item should be disabled: unmet + `disable`. */
export function isAccessDisabled(
  access: AccessRequirement | undefined,
  snapshot: AuthSnapshot,
): boolean {
  return !!access && access.mode === 'disable' && !meetsAccess(access, snapshot);
}
