import { InjectionToken } from '@angular/core';

export interface WorkspaceSettlement {
  wouldSettle(path: string): boolean;
  settle(path: string): Promise<void>;
}

const NOT_COMPOSED: WorkspaceSettlement = {
  wouldSettle: () => false,
  settle: async () => undefined,
};

export const WORKSPACE_SETTLEMENT = new InjectionToken<WorkspaceSettlement>(
  'lw.workspace-settlement',
  { providedIn: 'root', factory: () => NOT_COMPOSED },
);
