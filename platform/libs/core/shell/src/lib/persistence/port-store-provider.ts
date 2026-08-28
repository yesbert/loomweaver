import { InjectionToken, Provider, Type, inject } from '@angular/core';
import { KeyValueStore } from './key-value-store';
import { withCrossTabSync } from './cross-tab-sync-store';

export function providePortStore(
  token: InjectionToken<KeyValueStore>,
  store: KeyValueStore | Type<KeyValueStore>,
): Provider {
  if (typeof store === 'function') {
    return [
      store,
      {
        provide: token,
        useFactory: () => withCrossTabSync(inject(store)),
      },
    ];
  }
  return {
    provide: token,
    useFactory: () => withCrossTabSync(store),
  };
}
