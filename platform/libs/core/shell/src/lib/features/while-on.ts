import { effect, Injector, Signal, untracked } from '@angular/core';
import { Disposable } from '@loomweaver/plugin-sdk';

export function whileOn(
  injector: Injector,
  on: Signal<boolean>,
  register: () => Disposable,
): void {
  let registration: Disposable | undefined;
  effect(
    () => {
      if (on()) {
        registration ??= untracked(register);
        return;
      }
      registration?.dispose();
      registration = undefined;
    },
    { injector },
  );
}
