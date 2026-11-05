import { addressSlot } from '../addressing/address-form';
import { RegisteredSurface } from './surface-normalize';

export function withoutOmitted<T>(
  items: readonly T[],
  omitted: ReadonlySet<string>,
  idOf: (item: T) => string | undefined,
): readonly T[] {
  if (omitted.size === 0) {
    return items;
  }
  return items.filter((item) => {
    const id = idOf(item);
    return id === undefined || !omitted.has(id);
  });
}

export function idsOf(
  list: readonly { readonly id?: string }[],
): readonly string[] {
  return list.flatMap((item) => (item.id === undefined ? [] : [item.id]));
}

export function sameSlotAs(
  entry: RegisteredSurface,
): (existing: RegisteredSurface) => boolean {
  const path = entry.routable?.path;
  if (path !== undefined) {
    const slot = addressSlot(path);
    return (existing) =>
      existing.routable !== undefined &&
      addressSlot(existing.routable.path) === slot;
  }
  return (existing) =>
    existing.routable === undefined &&
    existing.id !== undefined &&
    existing.id === entry.id;
}

export function heldUnder(
  id: string,
  pluginId: string | undefined,
): (entry: RegisteredSurface) => boolean {
  return (entry) =>
    entry.id === id && (pluginId === undefined || entry.pluginId === pluginId);
}
