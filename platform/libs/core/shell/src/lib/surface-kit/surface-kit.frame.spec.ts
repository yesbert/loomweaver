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

  it('call a surface’s own stateChanged after the mirror took the push, with the same arguments', () => {
    const frame = installLwFrame();
    const handle = frame.state.watch<string>('draft');
    const heard: unknown[][] = [];

    const methods = frame.surfaceMethods({
      stateChanged: (key: string, value: unknown, loaded: boolean) => {
        heard.push([key, value, loaded, handle.value()]);
      },
    });
    methods.stateChanged('draft', 'pushed', true);

    expect(heard).toEqual([['draft', 'pushed', true, 'pushed']]);
    handle.dispose();
  });

  it('tell a watcher once where a surface’s own stateChanged feeds the push in a second time', () => {
    const frame = installLwFrame();
    const handle = frame.state.watch<{ step: number }>('wizard');
    const heard: unknown[] = [];
    handle.onChange((value) => {
      heard.push(value);
    });

    const methods = frame.surfaceMethods({
      stateChanged: (key: string, value: unknown, loaded: boolean) =>
        frame.state.apply(key, value, loaded),
    });
    methods.stateChanged('wizard', { step: 2 }, true);

    expect(heard).toEqual([{ step: 2 }]);
    handle.dispose();
  });

  it('call a surface’s own slotChanged after the toolbars took the push, with the same arguments', () => {
    const frame = installLwFrame();
    const view = { label: 'Tools', moreLabel: 'More', entries: [] };
    const own = vi.fn();

    frame.surfaceMethods({ slotChanged: own }).slotChanged('slot-1', view);

    expect(own).toHaveBeenCalledExactlyOnceWith('slot-1', view);
  });

  it('answer a picture themselves and leave a surface’s own capture uncalled, since one answer is given', () => {
    const frame = installLwFrame();
    const own = vi.fn();

    const methods = frame.surfaceMethods({ capture: own });

    expect(methods.capture).toBe(frame.capture);
    expect(own).not.toHaveBeenCalled();
  });
});
