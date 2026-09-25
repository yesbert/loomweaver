export const TOP_BAR_REGION = 'top-bar';
export const RAIL_REGION = 'primary';
export const LEFT_PANEL_REGION = 'left-panel';
export const RIGHT_PANEL_REGION = 'right-panel';
export const CONTENT_REGION = 'main';
export const STATUS_BAR_REGION = 'status-bar';

export interface ShellRegion {
  readonly id: string;
  readonly type: 'bar' | 'rail' | 'panel' | 'content';
  readonly dock: 'top' | 'left' | 'right' | 'center' | 'bottom';
}

/**
 * The base set of regions every scaffold agrees on. `primary` (rail) and `status-bar` (bar) are the
 * defaults the weaver recipe targets, so a scaffolded weaver's contributions land somewhere the
 * moment a scaffolded distribution boots. Emitted by both the layout recipe and the distribution's
 * app.config, and every template names a region through the constants above: a region id that
 * drifts renders a contribution invisible rather than failing.
 */
export const SHELL_REGIONS: readonly ShellRegion[] = [
  { id: TOP_BAR_REGION, type: 'bar', dock: 'top' },
  { id: RAIL_REGION, type: 'rail', dock: 'left' },
  { id: LEFT_PANEL_REGION, type: 'panel', dock: 'left' },
  { id: RIGHT_PANEL_REGION, type: 'panel', dock: 'right' },
  { id: CONTENT_REGION, type: 'content', dock: 'center' },
  { id: STATUS_BAR_REGION, type: 'bar', dock: 'bottom' },
];

export function renderRegions(indent: string): string {
  return SHELL_REGIONS.map(
    ({ id, type, dock }) =>
      `${indent}{ id: '${id}', type: '${type}', dock: '${dock}' },`,
  ).join('\n');
}
