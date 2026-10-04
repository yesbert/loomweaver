import { Injector } from '@angular/core';
import { PluginState } from '@loomweaver/plugin-sdk';
import { PluginStateBridge } from '../plugin-state-bridge';
import { FrameRemote } from './rpc/frame-rpc-contract';

export class FrameSession {
  readonly state: PluginStateBridge;

  private readonly cleanups: (() => void)[] = [];

  private remote: Promise<FrameRemote> | undefined;

  constructor(state: PluginState, injector: Injector) {
    this.state = new PluginStateBridge(state, injector, (key, value, loaded) =>
      this.notify((remote) => remote.stateChanged(key, value, loaded)),
    );
  }

  attach(remote: Promise<FrameRemote>): void {
    this.remote = remote;
  }

  notify(send: (remote: FrameRemote) => void): void {
    void this.remote?.then(send).catch(() => undefined);
  }

  addCleanup(cleanup: () => void): void {
    this.cleanups.push(cleanup);
  }

  end(): void {
    this.remote = undefined;
    this.state.stopAll();
    for (const cleanup of this.cleanups.splice(0)) {
      cleanup();
    }
  }
}
