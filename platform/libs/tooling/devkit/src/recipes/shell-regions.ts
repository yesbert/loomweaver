/**
 * The base set of regions every scaffold agrees on. `primary` (rail) and `status-bar` (bar) are the
 * defaults the weaver recipe targets, so a scaffolded weaver's contributions land somewhere the
 * moment a scaffolded distribution boots. Emitted by both the layout recipe and the distribution's
 * app.config, which is why it lives in one place: a region id that drifts here renders a
 * contribution invisible rather than failing.
 */
export const SHELL_REGIONS: readonly string[] = [
  "{ id: 'top-bar', type: 'bar', dock: 'top' }",
  "{ id: 'primary', type: 'rail', dock: 'left' }",
  "{ id: 'left-panel', type: 'panel', dock: 'left' }",
  "{ id: 'right-panel', type: 'panel', dock: 'right' }",
  "{ id: 'main', type: 'content', dock: 'center' }",
  "{ id: 'status-bar', type: 'bar', dock: 'bottom' }",
];

export function renderRegions(indent: string): string {
  return SHELL_REGIONS.map((region) => `${indent}${region},`).join('\n');
}
