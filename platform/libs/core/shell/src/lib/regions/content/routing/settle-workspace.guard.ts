import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { WORKSPACE_SETTLEMENT } from './workspace-settlement';
import { normalizePath } from '../content-path';

export const settleWorkspace: CanActivateFn = async (_route, state) => {
  const settlement = inject(WORKSPACE_SETTLEMENT);
  await settlement.settle(normalizePath(state.url));
  return true;
};
