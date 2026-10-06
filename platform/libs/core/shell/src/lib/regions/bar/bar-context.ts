import { InjectionToken } from '@angular/core';
import { MenuContext } from '@loomweaver/plugin-sdk';
import { DockPosition } from '../../layout/layout';
import {
  BarButtonItem,
  BarComponentItem,
  BarItem,
  BarSlot,
} from '../../foundation/bar-item';
import { ResolvedEntry } from '../../menu/menu-resolution';

export interface BarContext {
  readonly bar: string;
  readonly dock: DockPosition;
  readonly slot: BarSlot;
}

export type BarEntry =
  | ResolvedEntry<BarButtonItem>
  | { readonly item: BarComponentItem };

export const BAR_CONTEXT = new InjectionToken<BarContext>('BAR_CONTEXT');

export function isBarButton(item: BarItem): item is BarButtonItem {
  return !('component' in item);
}

export function barMenuContext(item: BarItem): MenuContext {
  return { targetKind: 'bar-item', id: item.id, bar: item.bar };
}

export function isButtonEntry(
  entry: BarEntry,
): entry is ResolvedEntry<BarButtonItem> {
  return 'key' in entry;
}
