/**
 * How large a picture of the workbench is drawn.
 *
 * `'screen'` draws at the density of the screen it is drawn on, which is what a request that says
 * nothing gets. `'plain'` draws one picture pixel per CSS pixel, which is the smaller picture a
 * fault report usually wants. `withinWidth` names a greatest width in picture pixels: the picture is
 * drawn no wider than that, keeping the proportions of what was pictured, and a width wider than the
 * workbench never enlarges it.
 */
export type WorkbenchPictureSize =
  | 'screen'
  | 'plain'
  | { readonly withinWidth: number };

const SMALLEST_SCALE = 0.05;

const LARGEST_SCALE = 4;

export function captureScale(preferred: number): number {
  if (!Number.isFinite(preferred) || preferred <= 0) {
    return 1;
  }
  return Math.min(LARGEST_SCALE, Math.max(SMALLEST_SCALE, preferred));
}

export function scaleForSize(
  size: WorkbenchPictureSize | undefined,
  screenDensity: number,
  cssWidth: number,
): number {
  const screen = captureScale(screenDensity);
  if (size === undefined || size === 'screen') {
    return screen;
  }
  if (size === 'plain') {
    return captureScale(1);
  }
  return captureScale(Math.min(screen, size.withinWidth / cssWidth));
}
