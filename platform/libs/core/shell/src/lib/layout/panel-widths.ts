export const DEFAULT_PANEL_WIDTH = 256;
export const MIN_PANEL_WIDTH = 180;
export const MAX_PANEL_WIDTH = 480;
export const DEFAULT_OVERLAY_WIDTH = 288;

const OVERLAY_DISMISS_MARGIN = '3rem';

export interface DeclaredPanelWidths {
  readonly width?: number;
  readonly minWidth?: number;
  readonly maxWidth?: number;
  readonly overlayWidth?: number;
}

export interface PanelWidths {
  readonly start: number;
  readonly min: number;
  readonly max: number;
}

export const WORKBENCH_PANEL_WIDTHS: PanelWidths = {
  start: DEFAULT_PANEL_WIDTH,
  min: MIN_PANEL_WIDTH,
  max: MAX_PANEL_WIDTH,
};

export function resolvePanelWidths(declared: DeclaredPanelWidths): PanelWidths {
  return {
    start: declared.width ?? DEFAULT_PANEL_WIDTH,
    min: declared.minWidth ?? MIN_PANEL_WIDTH,
    max: declared.maxWidth ?? MAX_PANEL_WIDTH,
  };
}

export function overlayWidthStyle(declared: DeclaredPanelWidths): string {
  const width = declared.overlayWidth ?? DEFAULT_OVERLAY_WIDTH;
  return `min(${width}px, calc(100vw - ${OVERLAY_DISMISS_MARGIN}))`;
}

export function assertPanelWidths(
  regionId: string,
  declared: DeclaredPanelWidths,
): void {
  const { start, min, max } = resolvePanelWidths(declared);
  if (min > max) {
    throw new Error(
      `provideLayout(): panel "${regionId}" declares a narrowest width of ${min} above its widest of ${max}.`,
    );
  }
  if (start < min || start > max) {
    throw new Error(
      `provideLayout(): panel "${regionId}" starts at ${start}, outside its bounds of ${min} to ${max}.`,
    );
  }
  const overlay = declared.overlayWidth;
  if (overlay !== undefined && !(Number.isFinite(overlay) && overlay > 0)) {
    throw new Error(
      `provideLayout(): panel "${regionId}" declares an overlay width of ${overlay}; it has to be a positive number of pixels.`,
    );
  }
}

export function clampToPanelWidths(px: number, widths: PanelWidths): number {
  return Math.round(Math.min(widths.max, Math.max(widths.min, px)));
}
