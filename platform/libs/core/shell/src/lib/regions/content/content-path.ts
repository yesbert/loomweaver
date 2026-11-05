import { ContentRoute } from '@loomweaver/plugin-sdk';
import {
  decodeSegment,
  normalizePath,
  segmentsOf,
} from '../../addressing/address-form';

export interface Addressable {
  readonly path: string;
}

export {
  decodeSegment,
  encodeSegment,
  normalizePath,
  segmentsOf,
} from '../../addressing/address-form';

export function isHomePath(path: string): boolean {
  return normalizePath(path) === '';
}

export function suffixOf(url: string): string {
  const index = url.search(/[?#]/);
  return index === -1 ? '' : url.slice(index);
}

export function isAtOrBelow(root: string, path: string): boolean {
  return path === root || path.startsWith(`${root}/`);
}

export function restBelow(tabRoot: string, url: string): string {
  const path = normalizePath(url);
  const suffix = suffixOf(url);
  if (tabRoot === '') {
    return path + suffix;
  }
  if (!path.startsWith(tabRoot + '/')) {
    return suffix;
  }
  return path.slice(tabRoot.length + 1) + suffix;
}

function patternMatches(pattern: string[], segments: string[]): boolean {
  return (
    pattern.length <= segments.length &&
    pattern.every(
      (part, index) => part.startsWith(':') || part === segments[index],
    )
  );
}

export function matchRoute<T extends Addressable>(
  routes: readonly T[],
  path: string,
): T | undefined {
  const segments = segmentsOf(path);
  let best: T | undefined;
  let bestLength = -1;
  for (const route of routes) {
    const pattern = segmentsOf(route.path);
    if (pattern.length <= bestLength || !patternMatches(pattern, segments)) {
      continue;
    }
    best = route;
    bestLength = pattern.length;
  }
  return best;
}

export function declaringRoute<T extends Addressable>(
  routes: readonly T[],
  path: string,
): T | undefined {
  const route = matchRoute(routes, path);
  if (route === undefined) {
    return undefined;
  }
  return segmentsOf(route.path).length === 0 && segmentsOf(path).length > 0
    ? undefined
    : route;
}

export function tabRootOf(
  routes: readonly Addressable[],
  path: string,
): string {
  const route = declaringRoute(routes, path);
  const segments = segmentsOf(path);
  if (!route) {
    return segments.join('/');
  }
  return segments.slice(0, segmentsOf(route.path).length).join('/');
}

export function paramsOfPattern(
  pattern: string,
  path: string,
): Record<string, string> {
  const parts = segmentsOf(pattern);
  const segments = segmentsOf(path);
  const params: Record<string, string> = {};
  for (const [index, part] of parts.entries()) {
    if (part.startsWith(':') && segments[index] !== undefined) {
      params[decodeSegment(part.slice(1))] = decodeSegment(segments[index]);
    }
  }
  return params;
}

export function routeParams(
  route: ContentRoute,
  path: string,
): Record<string, string> {
  return paramsOfPattern(route.path, path);
}
