export interface Identified {
  readonly id: string;
}

export function upsertBy<T>(
  items: readonly T[],
  item: T,
  matches: (existing: T) => boolean,
): readonly T[] {
  const index = items.findIndex(matches);
  if (index === -1) {
    return [...items, item];
  }
  const next = [...items];
  next[index] = item;
  return next;
}

export function upsertById<T extends Identified>(
  items: readonly T[],
  item: T,
): readonly T[] {
  return upsertBy(items, item, (existing) => existing.id === item.id);
}
