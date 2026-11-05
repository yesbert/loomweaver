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

  it('keep the platform’s own names over a surface’s', () => {
    const frame = installLwFrame();
    const own = vi.fn();

    const methods = frame.surfaceMethods({ stateChanged: own });
    (methods.stateChanged as (key: string, value: unknown, loaded: boolean) => void)('draft', 1, true);

    expect(own).not.toHaveBeenCalled();
  });
});
