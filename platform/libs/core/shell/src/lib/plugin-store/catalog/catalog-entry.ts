import {
  InstalledPlugin,
  dedupeById,
  isSameOriginUrl,
  nonEmptyText,
  parseInstalledPlugin,
} from '../lifecycle/installed-plugin';

/**
 * One entry of the distribution's plugin catalog: an {@link InstalledPlugin} plus the
 * display metadata the store dialog shows: a list of name, author, downloads, last update and
 * description, and a detail pane rendering the plugin's README **in-app**, never an embedded
 * external page.
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
  const readmeUrl = nonEmptyText(entry['readmeUrl']);
  return {
    ...base,
    description: nonEmptyText(entry['description']),
    icon: nonEmptyText(entry['icon']),
    category: nonEmptyText(entry['category']),
    author: nonEmptyText(entry['author']),
    downloads:
      typeof entry['downloads'] === 'number' && entry['downloads'] >= 0
        ? entry['downloads']
        : undefined,
    updated: nonEmptyText(entry['updated']),
    repository: httpUrl(entry['repository']),
    readmeUrl: readmeUrl && isSameOriginUrl(readmeUrl) ? readmeUrl : undefined,
    deployed: entry['deployed'] === true ? true : undefined,
  };
}

export function parseCatalogList(raw: unknown): readonly PluginCatalogEntry[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return dedupeById(raw.map((entry) => parseCatalogEntry(entry)));
}
