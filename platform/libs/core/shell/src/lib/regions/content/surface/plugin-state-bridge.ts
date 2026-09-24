import { effect, Injector } from '@angular/core';
import { PluginState, StateHandle } from '@loomweaver/plugin-sdk';

interface WatchedKey {
  readonly handle: StateHandle;
  readonly stop: () => void;
}

export type StatePush = (key: string, value: unknown, loaded: boolean) => void;

export class PluginStateBridge {
  private readonly watched = new Map<string, WatchedKey>();

  constructor(
    private readonly state: PluginState | undefined,
    private readonly injector: Injector,
    private readonly push: StatePush,
  ) {}

  watch(key: string): void {
    if (this.state === undefined || this.watched.has(key)) {
      return;
    }
    const handle = this.state.watch(key);
    const ref = effect(
      () => {
        const value = handle.value();
        const loaded = handle.loaded();
        queueMicrotask(() => this.push(key, value, loaded));
      },
      { injector: this.injector },
    );
    this.watched.set(key, {
      handle,
      stop: () => {
        ref.destroy();
        handle.dispose();
      },
    });
  }

  set(key: string, value: unknown): void {
    this.watched.get(key)?.handle.set(value);
  }

  clear(key: string): void {
    this.watched.get(key)?.handle.clear();
  }

  unwatch(key: string): void {
    this.watched.get(key)?.stop();
    this.watched.delete(key);
  }

  replay(): void {
    for (const [key, entry] of this.watched) {
      this.push(key, entry.handle.value(), entry.handle.loaded());
    }
  }

  stopAll(): void {
    for (const entry of this.watched.values()) {
      entry.stop();
    }
    this.watched.clear();
  }
}
