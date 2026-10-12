import { InjectionToken } from '@angular/core';

export interface WorkspaceSettlement {
  wouldSettle(path: string): boolean;
  settle(path: string): Promise<void>;
  withhold(path: string): void;
}

const NOT_COMPOSED: WorkspaceSettlement = {
  wouldSettle: () => false,
  settle: async () => undefined,
  withhold: () => undefined,
};

export const WORKSPACE_SETTLEMENT = new InjectionToken<WorkspaceSettlement>(
  'lw.workspace-settlement',
  { providedIn: 'root', factory: () => NOT_COMPOSED },
);
