export type FlagRecord = Readonly<Record<string, true>>;

export function isTrue(value: unknown): value is true {
  return value === true;
}

export function recordOf<T>(
  value: unknown,
  isValue: (entry: unknown) => entry is T,
): Readonly<Record<string, T>> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, T] =>
      isValue(entry[1]),
    ),
  );
}

export function parseRecord<T>(
  raw: string | undefined,
  isValue: (entry: unknown) => entry is T,
): Readonly<Record<string, T>> {
  if (!raw) {
    return {};
  }
  try {
    return recordOf(JSON.parse(raw), isValue);
  } catch {
    return {};
  }
}

export function toggledFlag(
  record: FlagRecord,
  key: string,
  on: boolean,
): FlagRecord {
  const next: Record<string, true> = { ...record };
  if (on) {
    next[key] = true;
  } else {
    delete next[key];
  }
  return next;
}
