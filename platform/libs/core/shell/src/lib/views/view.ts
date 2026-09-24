import { InjectionToken, Provider } from '@angular/core';

import { View } from '@loomweaver/plugin-sdk';

export type { View, ViewAction } from '@loomweaver/plugin-sdk';

/** Multi-provider token: each contribution adds one {@link View}. */
export const VIEW = new InjectionToken<readonly View[]>('VIEW');

/** Hooks views into regions — used by the host and by distributions. */
export function provideViews(...views: View[]): Provider[] {
  return views.map((view) => ({ provide: VIEW, useValue: view, multi: true }));
}
