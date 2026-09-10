import { InjectionToken } from '@angular/core';

export const ANNOUNCE_UPDATES = new InjectionToken<boolean>(
  'lw.announce-updates',
  { providedIn: 'root', factory: () => true },
);
