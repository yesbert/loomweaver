import { InjectionToken, Signal, signal } from '@angular/core';
import { SurfaceHold } from '@loomweaver/plugin-sdk';

export interface SurfaceHoldState {
  readonly held: Signal<boolean>;
  onRelease(listener: () => void): () => void;
  end(): void;
}

export const SURFACE_HOLD_STATE = new InjectionToken<SurfaceHoldState>(
  'lw.surface-hold-state',
);

export interface SurfaceHoldPair {
  readonly handle: SurfaceHold;
  readonly state: SurfaceHoldState;
}

export function createSurfaceHold(): SurfaceHoldPair {
  const held = signal(false);
  const listeners = new Set<() => void>();
  const release = () => {
    if (!held()) {
      return;
    }
    held.set(false);
    for (const listener of listeners) {
      listener();
    }
  };
  return {
    handle: {
      held: held.asReadonly(),
      hold: () => held.set(true),
      release,
    },
    state: {
      held: held.asReadonly(),
      onRelease: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      end: release,
    },
  };
}
