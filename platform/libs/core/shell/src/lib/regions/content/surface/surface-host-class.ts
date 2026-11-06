export interface SurfaceHostLook {
  readonly container: boolean;
  readonly variant: 'content' | 'panel';
  readonly padded: boolean;
}

export function surfaceHostClass(look: SurfaceHostLook): string {
  if (look.container) {
    return 'flex h-full min-h-0 min-w-0';
  }
  if (look.variant === 'panel') {
    return look.padded
      ? '@container/surface block h-full min-h-0 overflow-auto p-3 text-content'
      : '@container/surface block h-full min-h-0 overflow-auto text-content';
  }
  return look.padded
    ? '@container/surface block h-full overflow-auto bg-surface-raised p-6 text-content'
    : '@container/surface block h-full overflow-auto bg-surface-raised text-content';
}
