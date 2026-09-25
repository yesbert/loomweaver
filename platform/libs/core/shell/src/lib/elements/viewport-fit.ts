export const VIEWPORT_MARGIN = 4;

export function fitsInViewport(
  start: number,
  size: number,
  limit: number,
): boolean {
  return start >= VIEWPORT_MARGIN && start + size <= limit - VIEWPORT_MARGIN;
}

export function clampIntoViewport(
  start: number,
  size: number,
  limit: number,
): number {
  return Math.max(
    VIEWPORT_MARGIN,
    Math.min(start, limit - size - VIEWPORT_MARGIN),
  );
}
