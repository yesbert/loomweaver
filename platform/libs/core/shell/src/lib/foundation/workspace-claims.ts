import { InjectionToken } from '@angular/core';

export interface WorkspaceClaims {
  settle(path: string): Promise<void>;
}

const NOT_COMPOSED: WorkspaceClaims = {
  settle: async () => undefined,
};

export const WORKSPACE_CLAIMS = new InjectionToken<WorkspaceClaims>(
  'lw.workspace-claims',
  { providedIn: 'root', factory: () => NOT_COMPOSED },
);
