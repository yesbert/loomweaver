import { Surface } from '@loomweaver/plugin-sdk';
import { RegisteredContentRoute } from '../../contributions/contribution-registry';
import { segmentsOf } from '../../regions/content/content-path';
import { collidingParam } from '../../regions/content/tabs/tab-address';

export function followConflictMessage(
  pluginId: string,
  surface: Surface,
  routes: readonly RegisteredContentRoute[],
): string | null {
  const routable = surface.routable;
  if (routable?.follows !== true) {
    return null;
  }
  for (const other of routes) {
    if (other.follows !== true || other.path === routable.path) {
      continue;
    }
    const name = collidingParam(routable.path, other.path);
    if (name !== undefined) {
      return (
        `Plugin "${pluginId}": surface "${surface.id}" was refused. Its pattern ` +
        `"${routable.path}" and the following surface "${other.path}" both use ":${name}" but differ ` +
        `before it, so the name means two different things and substituting it by name would fill ` +
        `one surface's address with the other's value. Rename the parameter or align the patterns.`
      );
    }
  }
  return null;
}

export function broadPrefixReason(surface: Surface): string | undefined {
  const routable = surface.routable;
  if (routable?.rest !== true || segmentsOf(routable.path).length >= 2) {
    return undefined;
  }
  return (
    `The surface "${surface.id}" claims "${routable.path}" with rest: true, which owns most of ` +
    `the address space — the surface channel's confinement to its own tab root no longer ` +
    `constrains it, so the grant is required.`
  );
}
