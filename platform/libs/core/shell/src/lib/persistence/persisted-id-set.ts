export function toggledIdSet(
  set: ReadonlySet<string>,
  id: string,
  include: boolean,
): Set<string> {
  const next = new Set(set);
  if (include) {
    next.add(id);
  } else {
    next.delete(id);
  }
  return next;
}

export function parseIdSet(raw: string | undefined): ReadonlySet<string> {
  if (!raw) {
    return new Set();
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? new Set(
          parsed.filter((entry): entry is string => typeof entry === 'string'),
        )
      : new Set();
  } catch {
    return new Set();
  }
}
