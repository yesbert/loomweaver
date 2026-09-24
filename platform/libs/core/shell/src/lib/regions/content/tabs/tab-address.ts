import {
  EnvironmentProviders,
  InjectionToken,
  makeEnvironmentProviders,
} from '@angular/core';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import { matchRoute, segmentsOf } from '../content-path';

/** What the host knows when it works out where a following tab should point. */
export interface TabAddressInput {
  /** The following surface's id, when it declared one. */
  readonly surfaceId?: string;
  /** That surface's route pattern, e.g. `cedents/:cedentId/programs/:programId/treaties`. */
  readonly pattern: string;
  /** Parameter values of the address the user is on, by name. */
  readonly params: Readonly<Record<string, string>>;
  /** The full active content path, for a resolver that needs more than the names. */
  readonly activePath: string;
}

/**
 * A distribution's own answer to "where should this following tab point?" — part of the mapping is
 * domain knowledge the platform cannot have (a query parameter on one tab deciding a path segment on
 * another). Return `null` to fall back to the host's substitution.
 */
export type TabAddressResolver = (input: TabAddressInput) => string | null;

export const TAB_ADDRESS_RESOLVER = new InjectionToken<TabAddressResolver>(
  'TAB_ADDRESS_RESOLVER',
);

/**
 * Overrides or extends how the host computes the address of a **following** tab
 * (`routable: { follows: true }`). The platform supplies the default — the parameter values of the
 * current address substituted by name into the tab's own pattern — and the distribution supplies the
 * domain knowledge on top; returning `null` keeps the default for that tab.
 */
export function provideTabAddressResolver(
  resolve: TabAddressResolver,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: TAB_ADDRESS_RESOLVER, useValue: resolve },
  ]);
}

export function computedTabAddress(
  pattern: string,
  params: Readonly<Record<string, string>>,
): string {
  const resolved: string[] = [];
  for (const segment of segmentsOf(pattern)) {
    if (!segment.startsWith(':')) {
      resolved.push(segment);
      continue;
    }
    const value = params[segment.slice(1)];
    if (value === undefined) {
      break;
    }
    resolved.push(value);
  }
  return resolved.join('/');
}

export interface FollowingContext {
  readonly routes: readonly ContentRoute[];
  readonly params: Readonly<Record<string, string>>;
  readonly activePath: string;
  readonly resolver: TabAddressResolver | null;
}

export function followingTabAddress(
  route: ContentRoute,
  context: FollowingContext,
): string | null {
  const resolved = context.resolver?.({
    surfaceId: route.id,
    pattern: route.path,
    params: context.params,
    activePath: context.activePath,
  });
  if (resolved) {
    return resolved;
  }
  const computed = computedTabAddress(route.path, context.params);
  return leadsSomewhere(context.routes, computed) ? computed : null;
}

export function collidingParam(
  pattern: string,
  other: string,
): string | undefined {
  const prefixes = paramPrefixes(other);
  for (const [name, prefix] of paramPrefixes(pattern)) {
    const rival = prefixes.get(name);
    if (rival !== undefined && rival !== prefix) {
      return name;
    }
  }
  return undefined;
}

function paramPrefixes(pattern: string): Map<string, string> {
  const prefixes = new Map<string, string>();
  const segments = segmentsOf(pattern);
  for (const [index, segment] of segments.entries()) {
    if (segment.startsWith(':')) {
      prefixes.set(segment.slice(1), segments.slice(0, index).join('/'));
    }
  }
  return prefixes;
}

function leadsSomewhere(
  routes: readonly ContentRoute[],
  address: string,
): boolean {
  const owner = matchRoute(routes, address);
  return (
    owner !== undefined &&
    (owner.rest === true ||
      segmentsOf(owner.path).length === segmentsOf(address).length)
  );
}
