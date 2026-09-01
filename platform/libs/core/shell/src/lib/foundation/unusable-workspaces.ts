import { InjectionToken } from '@angular/core';

export interface UnusableWorkspaces {
  announced(): boolean;
}

const NOT_COMPOSED: UnusableWorkspaces = {
  announced: () => false,
};

export const UNUSABLE_WORKSPACES = new InjectionToken<UnusableWorkspaces>(
  'lw.unusable-workspaces',
  { providedIn: 'root', factory: () => NOT_COMPOSED },
);
