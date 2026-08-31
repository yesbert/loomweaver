import { InjectionToken } from '@angular/core';

export type PaddingDefault = 'none' | 'inset';

export const SURFACE_PADDING = new InjectionToken<PaddingDefault>(
  'lw.surface-padding',
  {
    providedIn: 'root',
    factory: () => 'none',
  },
);

export function effectivePadding(
  declared: boolean | undefined,
  fallback: PaddingDefault,
): boolean {
  return declared === undefined ? fallback === 'inset' : declared;
}
