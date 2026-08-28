import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { WORKSPACE_CLAIMS } from '../../../foundation/workspace-claims';
import { normalizePath } from '../content-path';

export const settleWorkspace: CanActivateFn = async (_route, state) => {
  const claims = inject(WORKSPACE_CLAIMS);
  await claims.settle(normalizePath(state.url));
  return true;
};
