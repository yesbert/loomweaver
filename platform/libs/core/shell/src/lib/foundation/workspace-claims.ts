import { InjectionToken } from '@angular/core';

export interface WorkspaceClaims {
  wouldSettle(path: string): boolean;
  settle(path: string): Promise<void>;
}

const NOT_COMPOSED: WorkspaceClaims = {
  wouldSettle: () => false,
  settle: async () => undefined,
};

export const WORKSPACE_CLAIMS = new InjectionToken<WorkspaceClaims>(
  'lw.workspace-claims',
  { providedIn: 'root', factory: () => NOT_COMPOSED },
);
