import { inject, isDevMode } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { isPopoutUrl } from '../../../popout/popout-path';
import { popoutNavigationRefusal } from '../../../popout/popout-refusal';
import { normalizePath } from '../content-path';
import { BootAddress } from './boot-address';

export const keepPopout: CanActivateFn = (_route, state) => {
  if (!isPopoutUrl(inject(BootAddress).path)) {
    return true;
  }
  if (isDevMode()) {
    console.warn(popoutNavigationRefusal(normalizePath(state.url)));
  }
  return false;
};
