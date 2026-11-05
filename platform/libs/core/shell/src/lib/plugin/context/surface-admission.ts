import { untracked } from '@angular/core';
import { MenuItem, Surface } from '@loomweaver/plugin-sdk';
import {
  ContributionRegistry,
  RegisteredContentRoute,
} from '../../contributions/contribution-registry';
import { ownerName } from '../../contributions/toolbar-registry';
import { segmentsOf } from '../../regions/content/content-path';
import { SettingsSection } from '../../settings-dialog/settings-model';
import { SettingsRegistry } from '../../settings-dialog/settings-registry';
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

export function surfaceHolderMessage(
  registry: ContributionRegistry,
  pluginId: string,
  surface: Surface,
): string | null {
  const address = surface.routable && addressOf(surface.routable.path);
  for (const held of untracked(() => [
    ...registry.views(),
    ...registry.contentRoutes(),
    ...registry.omittedContentRoutes(),
  ])) {
    if (held.pluginId === pluginId) {
      continue;
    }
    if (held.id === surface.id) {
      return replacingRefused(`Surface "${surface.id}"`, held.pluginId, pluginId);
    }
    if ('path' in held && addressOf(held.path) === address) {
      return replacingRefused(`Address "${address}"`, held.pluginId, pluginId);
    }
  }
  return null;
}

export function menuItemHolderMessage(
  registry: ContributionRegistry,
  pluginId: string,
  item: MenuItem,
): string | null {
  const held = untracked(() => registry.registeredMenuItems()).find(
    (entry) =>
      item.id !== undefined &&
      entry.item.id === item.id &&
      entry.ownerId !== pluginId,
  );
  return held
    ? replacingRefused(`Menu entry "${item.id}"`, held.ownerId, pluginId)
    : null;
}

export function settingsSectionHolderMessage(
  registry: SettingsRegistry,
  pluginId: string,
  section: SettingsSection,
): string | null {
  const holderId = untracked(() =>
    registry.registered().some((held) => held.id === section.id)
      ? registry.ownerOf(section.id)
      : pluginId,
  );
  return holderId === pluginId
    ? null
    : replacingRefused(`Settings section "${section.id}"`, holderId, pluginId);
}

function addressOf(path: string): string {
  return segmentsOf(path).join('/');
}

function replacingRefused(
  what: string,
  holderId: string | undefined,
  pluginId: string,
): string {
  return (
    `${what} is already registered by ${ownerName(holderId)}; the registration from ` +
    `${ownerName(pluginId)} is refused, because a plugin that does not run as the application's ` +
    `own code cannot replace what another owner contributed.`
  );
}
