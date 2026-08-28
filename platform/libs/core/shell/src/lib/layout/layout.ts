import { InjectionToken, Provider } from '@angular/core';

/** Where a region docks in the border topology. */
export type DockPosition = 'top' | 'bottom' | 'left' | 'right' | 'center';

/** Region anatomy types. */
export type RegionType = 'bar' | 'rail' | 'panel' | 'content';

/** One region the distribution places into the border frame. */
export interface LayoutRegion {
  /** Stable id (slot targeting, collapse state, ordering). */
  readonly id: string;
  readonly type: RegionType;
  readonly dock: DockPosition;
}

/** A distribution's declared base layout — the Core renders it (declarative, Stufe A). */
export interface ShellLayout {
  readonly regions: readonly LayoutRegion[];
}

/**
 * Bare default: a top Bar (header) over the Content-Area, with a status Bar under it.
 *
 * The status bar is not decoration — the shell's own default contributions include one that docks
 * there, and a default aimed at a region the default layout omits renders nothing and reports
 * nothing. Every region a shell default targets belongs here; `tools/check-region-ids.mjs` fails
 * the build when one does not.
 */
export const DEFAULT_LAYOUT: ShellLayout = {
  regions: [
    { id: 'top-bar', type: 'bar', dock: 'top' },
    { id: 'main', type: 'content', dock: 'center' },
    { id: 'status-bar', type: 'bar', dock: 'bottom' },
  ],
};

/** Active layout. Defaults to {@link DEFAULT_LAYOUT}; a distribution overrides it. */
export const SHELL_LAYOUT = new InjectionToken<ShellLayout>('SHELL_LAYOUT', {
  providedIn: 'root',
  factory: () => DEFAULT_LAYOUT,
});

/** A distribution declares its base layout with this provider. */
export function provideLayout(layout: ShellLayout): Provider {
  return { provide: SHELL_LAYOUT, useValue: layout };
}
