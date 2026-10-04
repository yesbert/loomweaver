import { Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PluginState, StateHandle } from '@loomweaver/plugin-sdk';
import { FrameSession } from './frame/frame-session';
import { FrameRemote } from './frame/rpc/frame-rpc-contract';
import { PluginStateBridge } from './plugin-state-bridge';

function memoryState(): PluginState & { disposed: string[] } {
  const values = new Map<string, ReturnType<typeof signal<unknown>>>();
  const disposed: string[] = [];
  return {
    disposed,
    watch<T>(key: string): StateHandle<T> {
      const value = values.get(key) ?? signal<unknown>(undefined);
      values.set(key, value);
      return {
        value: () => value() as T | undefined,
        loaded: () => true,
        set: (next: T) => value.set(next),
        clear: () => value.set(undefined),
        dispose: () => {
          disposed.push(key);
        },
        onChange: () => undefined,
      };
    },
  };
}

const settle = async () => {
  TestBed.tick();
  await new Promise((resolve) => setTimeout(resolve, 0));
};

describe('PluginStateBridge', () => {
  let pushes: [string, unknown, boolean][];
  let state: ReturnType<typeof memoryState>;
  let bridge: PluginStateBridge;

  beforeEach(() => {
    pushes = [];
    state = memoryState();
    bridge = new PluginStateBridge(state, TestBed.inject(Injector), (key, value, loaded) => {
      pushes.push([key, value, loaded]);
    });
  });

  it('pushes a watched key and every change to it, and stops once unwatched', async () => {
    bridge.watch('draft');
    await settle();
    bridge.set('draft', 'hello');
    await settle();
    expect(pushes.at(-1)).toEqual(['draft', 'hello', true]);

    bridge.unwatch('draft');
    expect(state.disposed).toEqual(['draft']);
  });

  it('refuses a key that is not a string, on every call, whoever makes it', () => {
    for (const call of [
      () => bridge.watch(7),
      () => bridge.set({ key: 'x' }, 1),
      () => bridge.clear(undefined),
      () => bridge.unwatch(null),
    ]) {
      expect(call).toThrow(/takes 'key' as a string/);
    }
  });

  it('carries an isolated plugin’s state to its frame through the same bridge', async () => {
    const changed: [string, unknown, boolean][] = [];
    const remote = {
      stateChanged: (key: string, value: unknown, loaded: boolean) => {
        changed.push([key, value, loaded]);
      },
    } as unknown as FrameRemote;
    const session = new FrameSession(state, TestBed.inject(Injector));
    session.attach(Promise.resolve(remote));

    session.state.watch('draft');
    session.state.set('draft', 'from the frame');
    await settle();

    expect(changed.at(-1)).toEqual(['draft', 'from the frame', true]);
    expect(() => session.state.watch(42)).toThrow(/takes 'key' as a string/);
    session.end();
    expect(state.disposed).toEqual(['draft']);
  });
});
