import { PluginContext } from '@loomweaver/plugin-sdk';
import { testbedTheme, registerTheme, releaseTheme } from './testbed-theme';

const KEY = 'testbed.theme.plugin';

interface Harness {
  run: () => void;
  contributeCalls: number;
  disposeCalls: number;
  ctx: PluginContext;
}

function harness(): Harness {
  const h: Harness = {
    run: () => undefined,
    contributeCalls: 0,
    disposeCalls: 0,
    ctx: {} as PluginContext,
  };
  h.ctx = {
    registerCommand: (cmd: { run: () => void }) => {
      h.run = cmd.run;
      return { dispose: () => undefined };
    },
    registerRailItem: () => ({ dispose: () => undefined }),
    contributeTheme: () => {
      h.contributeCalls++;
      return { dispose: () => h.disposeCalls++ };
    },
  } as unknown as PluginContext;
  return h;
}

describe('testbedTheme (producer-theme toggle)', () => {
  afterEach(() => {
    releaseTheme();
    localStorage.clear();
  });

  it('re-applies the persisted On choice on activation (survives reload)', () => {
    localStorage.setItem(KEY, '1');
    const h = harness();
    registerTheme(h.ctx);
    expect(h.contributeCalls).toBe(1);
  });

  it('does not apply when the persisted flag is off', () => {
    const h = harness();
    registerTheme(h.ctx);
    expect(h.contributeCalls).toBe(0);
  });

  it('the toggle persists the flag, applies/reverts, and announces to other windows', () => {
    const announced: string[] = [];
    testbedTheme.connectSync({ announce: (key) => announced.push(key) });
    const h = harness();
    registerTheme(h.ctx);

    h.run();
    expect(localStorage.getItem(KEY)).toBe('1');
    expect(h.contributeCalls).toBe(1);
    expect(announced).toEqual([KEY]);

    h.run();
    expect(localStorage.getItem(KEY)).toBe('0');
    expect(h.disposeCalls).toBe(1);
    expect(announced).toEqual([KEY, KEY]);
  });

  it('refresh re-applies from the flag a peer window wrote — without re-announcing', () => {
    const announced: string[] = [];
    const { key, refresh } = testbedTheme.connectSync({
      announce: (k) => announced.push(k),
    });
    expect(key).toBe(KEY);
    const h = harness();
    registerTheme(h.ctx);
    expect(h.contributeCalls).toBe(0);

    localStorage.setItem(KEY, '1');
    refresh();
    expect(h.contributeCalls).toBe(1);
    expect(announced).toEqual([]);

    localStorage.setItem(KEY, '0');
    refresh();
    expect(h.disposeCalls).toBe(1);
    expect(announced).toEqual([]);
  });
});
