import { InjectionToken } from '@angular/core';
import { MenuContext } from '@loomweaver/plugin-sdk';
import { DockPosition } from '../../layout/layout';
import { BarButtonItem, BarItem, BarSlot } from '../../foundation/bar-item';

export interface BarContext {
  readonly bar: string;
  readonly dock: DockPosition;
  readonly slot: BarSlot;
}

export const BAR_CONTEXT = new InjectionToken<BarContext>('BAR_CONTEXT');

export function isBarButton(item: BarItem): item is BarButtonItem {
  return !('component' in item);
}

export function barMenuContext(item: BarItem): MenuContext {
  return { targetKind: 'bar-item', id: item.id, bar: item.bar };
}
