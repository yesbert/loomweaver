import { ViewAction } from '@loomweaver/plugin-sdk';
export interface StripTab {
  readonly path: string;
  readonly title: string;
  readonly literalTitle: boolean;
  readonly icon?: string;
  readonly navPath?: string;
  readonly closable: boolean;
  readonly preview: boolean;
  readonly pinned: boolean;
  readonly instance?: string;
  readonly actions?: readonly ViewAction[];
}

export type TabAcceptance = boolean | ((path: string) => boolean);
