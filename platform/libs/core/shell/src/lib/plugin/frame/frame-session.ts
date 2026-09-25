import { Injector, effect, untracked } from '@angular/core';
import { PluginState, StateHandle } from '@loomweaver/plugin-sdk';
import { FrameRemote } from './rpc/frame-rpc-contract';

interface WatchedKey {
  readonly handle: StateHandle;
  readonly stop: () => void;
}

export class FrameSession {
  private readonly watched = new Map<string, WatchedKey>();

  private readonly cleanups: (() => void)[] = [];

  private remote: Promise<FrameRemote> | undefined;

  constructor(
    private readonly state: PluginState,
    private readonly injector: Injector,
  ) {}

  attach(remote: Promise<FrameRemote>): void {
    this.remote = remote;
  }

  notify(send: (remote: FrameRemote) => void): void {
    void this.remote?.then(send).catch(() => undefined);
  }

  watch(key: string): void {
    if (this.watched.has(key)) {
      return;
    }
    const handle = this.state.watch(key);
    const ref = effect(
      () => {
        const value = handle.value();
        const loaded = handle.loaded();
        untracked(() =>
          this.notify((remote) => remote.stateChanged(key, value, loaded)),
        );
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

  addCleanup(cleanup: () => void): void {
    this.cleanups.push(cleanup);
  }

  end(): void {
    this.remote = undefined;
    for (const entry of this.watched.values()) {
      entry.stop();
    }
    this.watched.clear();
    for (const cleanup of this.cleanups.splice(0)) {
      cleanup();
    }
  }
}
