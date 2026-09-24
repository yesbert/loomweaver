import { DirtySurface } from '@loomweaver/plugin-sdk';

export function dirtySurfaceOf(instance: unknown): DirtySurface | null {
  if (!instance || typeof instance !== 'object') {
    return null;
  }
  const candidate = instance as Partial<DirtySurface>;
  return typeof candidate.surfaceDirty === 'function'
    ? (candidate as DirtySurface)
    : null;
}

export function beforeCloseOf(
  instance: unknown,
): (() => boolean | Promise<boolean>) | null {
  if (!instance || typeof instance !== 'object') {
    return null;
  }
  const candidate = instance as Partial<DirtySurface>;
  return typeof candidate.surfaceBeforeClose === 'function'
    ? candidate.surfaceBeforeClose.bind(candidate)
    : null;
}

export function instanceDirty(instance: unknown): boolean {
  const aware = dirtySurfaceOf(instance);
  if (!aware) {
    return false;
  }
  try {
    return aware.surfaceDirty() === true;
  } catch (error) {
    console.error(
      'surfaceDirty() threw — treating the instance as dirty',
      error,
    );
    return true;
  }
}
