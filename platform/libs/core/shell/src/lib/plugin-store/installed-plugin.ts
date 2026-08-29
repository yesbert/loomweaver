import { CAPABILITIES, Capability } from '@loomweaver/plugin-sdk';
import { PluginIsolationLevel } from '../foundation/plugin-isolation-level';

/**
 * A community plugin the user installed from the distribution's catalog. Plain data — the
 * same shape the sandbox runtime needs to spawn it, plus display metadata for the store and
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

/**
 * One entry of the distribution's plugin catalog: an {@link InstalledPlugin} plus the
 * display metadata the store dialog shows (the Obsidian community-plugins model — list of name,
 * author, downloads, last update and description; a detail pane rendering the plugin's README
 * **in-app**, never an embedded external page).
 */
export interface PluginCatalogEntry extends InstalledPlugin {
  /** Short description shown in the store list. */
  readonly description?: string;
  /** Icon name for the install-consent dialog — resolved by the host icon registry. */
  readonly icon?: string;
  /** Operator-curated category, shown as a badge and matched by the store search. */
  readonly category?: string;
  /** Plugin author, shown in the list and the detail pane. */
  readonly author?: string;
  /** Install/download count, display-only (the operator's stats). */
  readonly downloads?: number;
  /** ISO date of the last update, display-only. */
  readonly updated?: string;
  /** External link to the plugin's repository/homepage — rendered as a plain link, never framed. */
  readonly repository?: string;
  /**
   * Same-origin URL of the plugin's README (Markdown) — the operator copies it into the store next
   * to the plugin files; the detail pane fetches and renders it sanitized in-app.
   */
  readonly readmeUrl?: string;
  /**
   * `true` for a plugin the operator **deploys**: active for every user without a consent dialog,
   * holding exactly the capabilities this entry names, and gone again once the catalog stops
   * carrying it. Omitted or `false` means the entry is merely **offered** — the user browses it,
   * consents and installs it, which is the only path that grants anything on their say-so.
   *
   * The authority behind a deployed entry is the operator's, so the user is shown it but is not
   * asked about it and cannot remove it.
   */
  readonly deployed?: boolean;
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

function optionalString(raw: unknown): string | undefined {
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
  const iconUrl = optionalString(entry['iconUrl']);
  return {
    id: entry['id'],
    name: optionalString(entry['name']) ?? entry['id'],
    entryUrl: entry['entryUrl'],
    capabilities: parseCapabilities(entry['capabilities']),
    version: optionalString(entry['version']),
    iconUrl: iconUrl && isSameOriginUrl(iconUrl) ? iconUrl : undefined,
    level:
      entry['level'] === 'embedded' || entry['level'] === 'isolated'
        ? entry['level']
        : undefined,
  };
}

function httpUrl(raw: unknown): string | undefined {
  if (typeof raw !== 'string') {
    return undefined;
  }
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? raw
      : undefined;
  } catch {
    return undefined;
  }
}

export function parseCatalogEntry(
  raw: unknown,
): PluginCatalogEntry | undefined {
  const base = parseInstalledPlugin(raw);
  if (!base) {
    return undefined;
  }
  const entry = raw as Record<string, unknown>;
  const readmeUrl = optionalString(entry['readmeUrl']);
  return {
    ...base,
    description: optionalString(entry['description']),
    icon: optionalString(entry['icon']),
    category: optionalString(entry['category']),
    author: optionalString(entry['author']),
    downloads:
      typeof entry['downloads'] === 'number' && entry['downloads'] >= 0
        ? entry['downloads']
        : undefined,
    updated: optionalString(entry['updated']),
    repository: httpUrl(entry['repository']),
    readmeUrl: readmeUrl && isSameOriginUrl(readmeUrl) ? readmeUrl : undefined,
    deployed: entry['deployed'] === true ? true : undefined,
  };
}

function dedupeById<T extends { readonly id: string }>(
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

export function parseCatalogList(raw: unknown): readonly PluginCatalogEntry[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return dedupeById(raw.map((entry) => parseCatalogEntry(entry)));
}
