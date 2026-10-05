import { SettingCodec } from './persisted-setting';
import { parseStored } from './parse-stored';

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
  const parsed = parseStored(raw);
  return Array.isArray(parsed)
    ? new Set(
        parsed.filter((entry): entry is string => typeof entry === 'string'),
      )
    : new Set();
}

export const ID_SET_CODEC: SettingCodec<ReadonlySet<string>> = {
  parse: parseIdSet,
  serialize: (set) => JSON.stringify([...set]),
};
