import { installLwToolbarHost } from '../elements/toolbar/toolbar-bridge';
import { installLwFrame } from './surface-kit.frame';

describe('the methods the frame kit answers the workbench with', () => {
  afterAll(() => {
    installLwToolbarHost(undefined);
  });

  it('answer a state push, so a watched value arrives and reads as loaded', () => {
    const frame = installLwFrame();
    const methods = frame.surfaceMethods({ render: () => undefined });
    const watched: string[] = [];
    const handle = frame
      .connectState({
        stateWatch: (key) => {
          watched.push(key);
        },
        stateSet: () => undefined,
        stateClear: () => undefined,
        stateUnwatch: () => undefined,
      })
      .watch<string>('draft');
    expect(handle.loaded()).toBe(false);

    methods.stateChanged('draft', 'from the workbench', true);

    expect(watched).toEqual(['draft']);
    expect(handle.value()).toBe('from the workbench');
    expect(handle.loaded()).toBe(true);
    handle.dispose();
  });

  it('leave a state push to a surface’s own stateChanged alone where it passes one', () => {
    const frame = installLwFrame();
    const handle = frame.state.watch<string>('draft');
    const own = vi.fn();

    frame.surfaceMethods({ stateChanged: own }).stateChanged('draft', 'pushed', true);

    expect(own).toHaveBeenCalledExactlyOnceWith('draft', 'pushed', true);
    expect(handle.value()).toBeUndefined();
    expect(handle.loaded()).toBe(false);
    handle.dispose();
  });

  it('show watchers only what a surface’s own stateChanged applied, once, where it transforms the push', () => {
    const frame = installLwFrame();
    const handle = frame.state.watch<{ step: number }>('wizard');
    const raw: unknown[] = [];
    const heard: unknown[] = [];
    handle.onChange((value) => {
      heard.push(value);
    });

    const methods = frame.surfaceMethods({
      stateChanged: (key: string, value: unknown, loaded: boolean) => {
        raw.push(value);
        frame.state.apply(key, { step: (value as { step: number }).step + 1 }, loaded);
      },
    });
    methods.stateChanged('wizard', { step: 2 }, true);

    expect(raw).toEqual([{ step: 2 }]);
    expect(heard).toEqual([{ step: 3 }]);
    expect(handle.value()).toEqual({ step: 3 });
    handle.dispose();
  });

  it('answer a toolbar push themselves and leave a surface’s own slotChanged uncalled', () => {
    const frame = installLwFrame();
    const own = vi.fn();

    frame
      .surfaceMethods({ slotChanged: own })
      .slotChanged('slot-1', { label: 'Tools', moreLabel: 'More', entries: [] });

    expect(own).not.toHaveBeenCalled();
  });

  it('answer a picture themselves and leave a surface’s own capture uncalled', () => {
    const frame = installLwFrame();
    const own = vi.fn();

    const methods = frame.surfaceMethods({ capture: own });

    expect(methods.capture).toBe(frame.capture);
    expect(own).not.toHaveBeenCalled();
  });

  it('answer every push without throwing where a surface passes no methods at all', () => {
    const frame = installLwFrame();
    const handle = frame.state.watch<string>('draft');

    const methods = frame.surfaceMethods();
    methods.slotChanged('slot-1', { label: 'Tools', moreLabel: 'More', entries: [] });
    methods.stateChanged('draft', 'pushed', true);

    expect(handle.value()).toBe('pushed');
    handle.dispose();
  });
});
