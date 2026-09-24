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
