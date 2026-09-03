import {
  DestroyRef,
  effect,
  Injector,
  Signal,
  untracked,
} from '@angular/core';
import { Disposable } from '@loomweaver/plugin-sdk';

export function whileOn(
  injector: Injector,
  on: Signal<boolean>,
  register: () => Disposable,
): void {
  let registration: Disposable | undefined;
  const release = (): void => {
    registration?.dispose();
    registration = undefined;
  };
  effect(
    () => {
      if (on()) {
        registration ??= untracked(register);
        return;
      }
      release();
    },
    { injector },
  );
  injector.get(DestroyRef).onDestroy(release);
}
