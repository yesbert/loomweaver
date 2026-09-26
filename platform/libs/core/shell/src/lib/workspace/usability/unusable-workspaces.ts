import { InjectionToken } from '@angular/core';

/**
 * What the workbench recognised about workspaces that cannot work as their declaration describes.
 * A product reads {@link ids} to answer for itself, which is what makes silencing the workbench's
 * own notice a choice rather than a blindfold.
 */
export interface UnusableWorkspaces {
  /** The workspaces that declare content of their own and whose stored arrangement leaves them none. */
  ids(): ReadonlySet<string>;
  /** Whether the workbench itself says so, here and now, for the workspace the user is in. */
  announced(): boolean;
}

const NOT_COMPOSED: UnusableWorkspaces = {
  ids: () => new Set(),
  announced: () => false,
};

export const UNUSABLE_WORKSPACES = new InjectionToken<UnusableWorkspaces>(
  'lw.unusable-workspaces',
  { providedIn: 'root', factory: () => NOT_COMPOSED },
);
