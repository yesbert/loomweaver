import { LwButtonVariant } from '@loomweaver/plugin-sdk';

/**
 * One entry a `<lw-toolbar>` draws, already resolved and worded by whoever drives the element:
 * the workbench in the page, the frame kit inside an isolated surface. The element draws; it
 * decides nothing about commands, sessions or words.
 */
export interface LwToolbarEntry {
  readonly key: string;
  readonly label: string;
  readonly group?: string;
  readonly order?: number;
  readonly icon?: string;
  readonly shortcut?: string;
  readonly pressed?: boolean;
  readonly disabled?: boolean;
  readonly opensMenu?: boolean;
  readonly hasContextMenu?: boolean;
  readonly variant?: LwButtonVariant;
}
