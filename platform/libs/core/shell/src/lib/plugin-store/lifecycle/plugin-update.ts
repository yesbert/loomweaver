import { Capability } from '@loomweaver/plugin-sdk';
import { InstalledPlugin, PluginCatalogEntry } from '../installed-plugin';

function segments(version: string): readonly number[] {
  return version
    .split('.')
    .map((part) => Number.parseInt(part, 10))
    .map((value) => (Number.isNaN(value) ? 0 : value));
}

export function isNewerVersion(
  candidate: string | undefined,
  current: string | undefined,
): boolean {
  if (!candidate || !current || candidate === current) {
    return false;
  }
  const left = segments(candidate);
  const right = segments(current);
  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    const a = left[index] ?? 0;
    const b = right[index] ?? 0;
    if (a !== b) {
      return a > b;
    }
  }
  return false;
}

export function availableUpdate(
  installed: InstalledPlugin | undefined,
  entry: PluginCatalogEntry | undefined,
): PluginCatalogEntry | undefined {
  if (!installed || !entry) {
    return undefined;
  }
  return isNewerVersion(entry.version, installed.version) ? entry : undefined;
}

export function addedCapabilities(
  entry: PluginCatalogEntry,
  installed: InstalledPlugin,
): readonly Capability[] {
  const consented = new Set(installed.capabilities ?? []);
  return (entry.capabilities ?? []).filter(
    (capability) => !consented.has(capability),
  );
}
