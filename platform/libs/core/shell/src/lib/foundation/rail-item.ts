import { InjectionToken, Provider } from '@angular/core';

import { RailItem } from '@loomweaver/plugin-sdk';

export type { RailItem } from '@loomweaver/plugin-sdk';

/** Multi-provider token: each contribution adds one {@link RailItem}. */
export const RAIL_ITEM = new InjectionToken<readonly RailItem[]>('RAIL_ITEM');

/** Hooks rail commands into the shell — used by the host and by distributions. */
export function provideRailItems(...items: RailItem[]): Provider[] {
  return items.map((item) => ({
    provide: RAIL_ITEM,
    useValue: item,
    multi: true,
  }));
}
