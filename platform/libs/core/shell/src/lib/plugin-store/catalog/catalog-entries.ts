import { PluginCatalog } from './plugin-catalog';
import { PluginCatalogEntry } from '../installed-plugin';

export async function loadCatalogEntries(
  catalog: PluginCatalog | null,
): Promise<readonly PluginCatalogEntry[] | undefined> {
  if (!catalog) {
    return [];
  }
  try {
    return await catalog.load();
  } catch {
    return undefined;
  }
}

export function matchesQuery(
  fields: readonly (string | undefined)[],
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized.length) {
    return true;
  }
  return fields
    .map((field) => field ?? '')
    .join(' ')
    .toLowerCase()
    .includes(normalized);
}
