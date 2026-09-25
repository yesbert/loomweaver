import { CAPABILITIES, Capability } from '@loomweaver/plugin-sdk';
import { PluginIsolationLevel } from '../../foundation/plugin-isolation-level';
import { SettingCodec } from '../../persistence/stored-values/persisted-setting';

/**
 * A community plugin the user installed from the distribution's catalog. Plain data — the same
 * shape the {@link FramePluginRuntime} needs to spawn it, plus display metadata for the store and
 * permissions surfaces.
 */
export interface InstalledPlugin {
  /** Stable plugin id — also the id capabilities are granted to (default-deny). */
  readonly id: string;
  /** Display name shown in the store and permissions surfaces. */
  readonly name: string;
  /** Same-origin URL of the plugin's entry document. */
  readonly entryUrl: string;
  /**
   * Capabilities the plugin declares. Accepting the install dialog grants exactly these — the user's
   * consent replaces the composition root's grant for installed plugins.
   */
  readonly capabilities?: readonly Capability[];
  /**
   * Catalog version at install/update time. Drives update detection (a strictly newer catalog
   * version offers an update) and is part of the runtime's respawn signature — a version-only
   * change respawns the running plugin.
   */
  readonly version?: string;
  /** Same-origin URL of the plugin's list icon (an image the operator ships with the plugin). */
  readonly iconUrl?: string;
  /**
   * The level this entry asks to run at. It is a request, not a decision: the composition sets the
   * highest level a catalog may confer, an entry at or below it runs at what it asked for, and one
   * above it is refused rather than quietly run lower. Omitted means isolated.
   */
  readonly level?: PluginIsolationLevel;
}

export function isSameOriginUrl(url: string): boolean {
  try {
    return new URL(url, document.baseURI).origin === location.origin;
  } catch {
    return false;
  }
}

function parseCapabilities(raw: unknown): readonly Capability[] | undefined {
  if (!Array.isArray(raw)) {
    return undefined;
  }
  return raw.filter(
    (cap): cap is Capability =>
      typeof cap === 'string' &&
      (CAPABILITIES as readonly string[]).includes(cap),
  );
}

export function nonEmptyText(raw: unknown): string | undefined {
  return typeof raw === 'string' && raw.length > 0 ? raw : undefined;
}

export function parseInstalledPlugin(
  raw: unknown,
): InstalledPlugin | undefined {
  if (typeof raw !== 'object' || raw === null) {
    return undefined;
  }
  const entry = raw as Record<string, unknown>;
  if (typeof entry['id'] !== 'string' || entry['id'].length === 0) {
    return undefined;
  }
  if (
    typeof entry['entryUrl'] !== 'string' ||
    !isSameOriginUrl(entry['entryUrl'])
  ) {
    return undefined;
  }
  const iconUrl = nonEmptyText(entry['iconUrl']);
  return {
    id: entry['id'],
    name: nonEmptyText(entry['name']) ?? entry['id'],
    entryUrl: entry['entryUrl'],
    capabilities: parseCapabilities(entry['capabilities']),
    version: nonEmptyText(entry['version']),
    iconUrl: iconUrl && isSameOriginUrl(iconUrl) ? iconUrl : undefined,
    level:
      entry['level'] === 'embedded' || entry['level'] === 'isolated'
        ? entry['level']
        : undefined,
  };
}

export function dedupeById<T extends { readonly id: string }>(
  items: readonly (T | undefined)[],
): readonly T[] {
  const result: T[] = [];
  for (const item of items) {
    if (item && result.every((existing) => existing.id !== item.id)) {
      result.push(item);
    }
  }
  return result;
}

export function parseInstalledList(
  raw: string | undefined,
): readonly InstalledPlugin[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return dedupeById(parsed.map((raw) => parseInstalledPlugin(raw)));
  } catch {
    return [];
  }
}

export const INSTALLED_LIST_CODEC: SettingCodec<readonly InstalledPlugin[]> = {
  parse: parseInstalledList,
  serialize: (list) => JSON.stringify(list),
};
