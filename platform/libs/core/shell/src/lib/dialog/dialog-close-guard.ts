import { InjectionToken } from '@angular/core';

export interface DialogCloseGuard {
  mustAsk(candidates: readonly unknown[]): boolean;
  confirmClose(candidates: readonly unknown[]): Promise<boolean>;
}

const NOT_COMPOSED: DialogCloseGuard = {
  mustAsk: () => false,
  confirmClose: () => Promise.resolve(true),
};

export const DIALOG_CLOSE_GUARD = new InjectionToken<DialogCloseGuard>(
  'lw.dialog-close-guard',
  { providedIn: 'root', factory: () => NOT_COMPOSED },
);
