import { InjectionToken } from '@angular/core';
import {
  PluginCatalogEntry,
  isSameOriginUrl,
  parseCatalogList,
} from '../installed-plugin';


/**
 * The distribution's plugin catalog port: the operator-curated list of community plugins a
 * user may install. The platform only defines the seam — what is not in the catalog does not exist
 * for the shell; per-tenant curation is the product backend answering the catalog request
 * tenant-dependently.
 */
export interface PluginCatalog {
  load(): Promise<readonly PluginCatalogEntry[]>;
}

/**
 * Injection token for the {@link PluginCatalog}. No default — a distribution without a catalog has no
 * plugin store (and no store settings section). Provide one with {@link providePluginCatalog}.
 */
export const PLUGIN_CATALOG = new InjectionToken<PluginCatalog>(
  'lw.plugin-catalog',
);

/**
 * A {@link PluginCatalog} that fetches a same-origin JSON document (an array of
 * {@link PluginCatalogEntry}). Entries are parsed defensively: junk shapes, foreign-origin
 * `entryUrl`s and unknown capability names are dropped. The catalog URL itself must be same-origin —
 * the store is the distribution's own origin; a product that wants another source
 * implements the {@link PluginCatalog} port directly.
 */
export function urlPluginCatalog(url: string): PluginCatalog {
  if (!isSameOriginUrl(url)) {
    throw new Error(`Plugin catalog URL must be same-origin, got "${url}".`);
  }
  return {
    async load() {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Plugin catalog at "${url}" answered ${response.status}.`,
        );
      }
      return parseCatalogList(await response.json());
    },
  };
}
