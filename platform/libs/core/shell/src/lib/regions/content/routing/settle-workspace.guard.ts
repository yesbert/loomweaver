import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { WORKSPACE_SETTLEMENT } from './workspace-settlement';
import { isPopoutUrl } from '../../../popout/popout-path';
import { normalizePath } from '../content-path';
import { BootAddress } from './boot-address';

export const settleWorkspace: CanActivateFn = async (_route, state) => {
  const settlement = inject(WORKSPACE_SETTLEMENT);
  await settlement.settle(normalizePath(state.url));
  return true;
};

export const withholdSettlement: CanActivateFn = (_route, state) => {
  if (!isPopoutUrl(inject(BootAddress).path)) {
    inject(WORKSPACE_SETTLEMENT).withhold(normalizePath(state.url));
  }
  return true;
};
