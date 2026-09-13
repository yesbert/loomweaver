import { InjectionToken, Provider } from '@angular/core';
import { assertPanelWidths } from './panel-widths';

/** Where a region docks in the border topology. */
export type DockPosition = 'top' | 'bottom' | 'left' | 'right' | 'center';

/** Region anatomy types. */
export type RegionType = 'bar' | 'rail' | 'panel' | 'content';

/**
 * A side panel the distribution places into the border frame. It is the one kind of region a person
 * resizes, so it is the one kind that may declare its widths, in pixels. Each is optional and falls
 * back to the workbench's own (start 256, narrowest 180, widest 480). The declared widths apply where
 * the panel stands beside the content; on a narrow viewport the panel is an overlay of its own width.
 */
export interface PanelRegion {
  /** Stable id (slot targeting, collapse state, ordering). */
  readonly id: string;
  readonly type: 'panel';
  readonly dock: DockPosition;
  /** The width the panel shows until a person resizes it, and what resetting the layout returns to. */
  readonly width?: number;
  /** The narrowest the panel may be made, by dragging, from the keyboard or from code. */
  readonly minWidth?: number;
  /** The widest the panel may be made; a stored width above it is shown at this width. */
  readonly maxWidth?: number;
}

/** A bar, rail or content region the distribution places into the border frame. */
export interface NonPanelRegion {
  /** Stable id (slot targeting, collapse state, ordering). */
  readonly id: string;
  readonly type: Exclude<RegionType, 'panel'>;
  readonly dock: DockPosition;
}

/** One region the distribution places into the border frame. */
export type LayoutRegion = PanelRegion | NonPanelRegion;

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

/**
 * A distribution declares its base layout with this provider. A panel region whose narrowest width
 * exceeds its widest, or whose start width lies outside its own bounds, is refused here, naming the
 * region.
 */
export function provideLayout(layout: ShellLayout): Provider {
  for (const region of layout.regions) {
    if (region.type === 'panel') {
      assertPanelWidths(region.id, region);
    }
  }
  return { provide: SHELL_LAYOUT, useValue: layout };
}
