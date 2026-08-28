import { ContentRoute } from '@loomweaver/plugin-sdk';

export const ROUTE_OMIT_PREFIX = 'route:';

export function isRouteOmitted(
  route: ContentRoute,
  omitted: ReadonlySet<string>,
): boolean {
  return route.id !== undefined && omitted.has(ROUTE_OMIT_PREFIX + route.id);
}
