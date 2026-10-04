import { effect, Injector } from '@angular/core';
import { PluginState, StateHandle } from '@loomweaver/plugin-sdk';
import { textArgument } from './frame/rpc/wire-fields';

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

  watch(raw: unknown): void {
    const key = textArgument(raw, 'stateWatch', 'key');
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

  set(raw: unknown, value: unknown): void {
    this.watched.get(textArgument(raw, 'stateSet', 'key'))?.handle.set(value);
  }

  clear(raw: unknown): void {
    this.watched.get(textArgument(raw, 'stateClear', 'key'))?.handle.clear();
  }

  unwatch(raw: unknown): void {
    const key = textArgument(raw, 'stateUnwatch', 'key');
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
