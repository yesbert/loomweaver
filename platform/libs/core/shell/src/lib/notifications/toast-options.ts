import { InjectionToken } from '@angular/core';

/** Where the workbench shows its toasts: the edge of the window, then the side along it. */
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export const TOAST_POSITION = new InjectionToken<ToastPosition>(
  'lw.toast-position',
  { providedIn: 'root', factory: () => 'bottom-right' },
);

export const DRAW_TOASTS = new InjectionToken<boolean>('lw.draw-toasts', {
  providedIn: 'root',
  factory: () => true,
});
