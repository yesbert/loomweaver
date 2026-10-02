export interface PaneViewOptions {
  readonly variant: 'titles' | 'icons';

  readonly split: boolean;

  readonly focus: boolean;

  readonly pointer: boolean;

  readonly maximize: boolean;

  readonly closeLabel: string;

  readonly body: 'content' | 'panel';

  readonly surfaceActions: boolean;
}

export const CONTENT_PANE_OPTIONS: PaneViewOptions = {
  variant: 'titles',
  split: true,
  focus: true,
  pointer: false,
  maximize: true,
  closeLabel: 'content.split.closePane',
  body: 'content',
  surfaceActions: true,
};

export const PANEL_PANE_OPTIONS: PaneViewOptions = {
  variant: 'icons',
  split: false,
  focus: false,
  pointer: false,
  maximize: false,
  closeLabel: 'panel.stack.unstack',
  body: 'panel',
  surfaceActions: false,
};

export const CONTAINER_PANE_OPTIONS: PaneViewOptions = {
  variant: 'titles',
  split: true,
  focus: false,
  pointer: true,
  maximize: false,
  closeLabel: 'content.split.closePane',
  body: 'content',
  surfaceActions: true,
};
