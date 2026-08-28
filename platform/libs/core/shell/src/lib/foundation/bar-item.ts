import { InjectionToken, Provider } from '@angular/core';

import { BarItem } from '@loomweaver/plugin-sdk';

export type {
  BarSlot,
  BarComponentItem,
  BarButtonItem,
  BarItem,
} from '@loomweaver/plugin-sdk';

/** Multi-provider token: each contribution adds one {@link BarItem}. */
export const BAR_ITEM = new InjectionToken<readonly BarItem[]>('BAR_ITEM');

/** Hooks bar items into the shell — used by the host and by distributions. */
export function provideBarItems(...items: BarItem[]): Provider[] {
  return items.map((item) => ({
    provide: BAR_ITEM,
    useValue: item,
    multi: true,
  }));
}
