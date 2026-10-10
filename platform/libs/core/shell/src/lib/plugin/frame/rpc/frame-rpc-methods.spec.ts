import { HostPluginContext } from '../../context/host-plugin-context';
import { KeyValueStore } from '../../../persistence/key-value-store';
import { StateSyncService } from '../../../persistence/cross-tab/state-sync.service';
import { PluginInstallService } from '../../../plugin-store/lifecycle/plugin-install.service';
import { FrameSession } from '../frame-session';
import { frameRpcMethods } from './frame-rpc-methods';

function methodsFor(ctx: Partial<HostPluginContext>, session = {}) {
  return frameRpcMethods({
    pluginId: 'framed',
    ctx: ctx as HostPluginContext,
    origins: undefined,
    session: session as FrameSession,
    install: {} as PluginInstallService,
    store: {} as KeyValueStore,
    sync: {} as StateSyncService,
    reportRefusal: () => undefined,
  });
}

describe('frameRpcMethods — leaving a container child out across the seam', () => {
  it('brings a child back only on a real true', () => {
    const setChildShown = vi.fn();
    const methods = methodsFor({ setChildShown });

    methods.setChildShown('pane.child', 'yes' as unknown as boolean);
    methods.setChildShown('pane.child', true);

    expect(setChildShown.mock.calls).toEqual([
      ['pane.child', false],
      ['pane.child', true],
    ]);
  });
});

describe('frameRpcMethods — a text argument across the seam', () => {
  const NOT_TEXT = 7 as unknown as string;

  it('refuses one that is not a string, naming the call and the argument, before the host sees it', () => {
    const ctx = {
      navigateContent: vi.fn(),
      setChildShown: vi.fn(),
      retitleSurface: vi.fn(),
      invokeCommand: vi.fn(),
    };
    const methods = methodsFor(ctx);

    expect(() => methods.navigateContent(NOT_TEXT)).toThrow(
      "navigateContent takes 'path' as a string",
    );
    expect(() => methods.setChildShown(NOT_TEXT, true)).toThrow(TypeError);
    expect(() => methods.retitleSurface('nav', NOT_TEXT)).toThrow(
      "retitleSurface takes 'title' as a string",
    );
    expect(() => methods.invokeCommand(NOT_TEXT)).toThrow(TypeError);
    for (const call of Object.values(ctx)) {
      expect(call).not.toHaveBeenCalled();
    }
  });

  it('refuses a state key that is not a string the same way', () => {
    const session = { watch: vi.fn(), set: vi.fn() };
    const methods = methodsFor({}, session);

    expect(() => methods.stateWatch(NOT_TEXT)).toThrow(TypeError);
    expect(() => methods.stateSet(NOT_TEXT, 1)).toThrow(TypeError);
    expect(session.watch).not.toHaveBeenCalled();
    expect(session.set).not.toHaveBeenCalled();
  });

  it('passes a string through as it is, the empty one included', () => {
    const navigateContent = vi.fn();
    const methods = methodsFor({ navigateContent });

    methods.navigateContent('');
    methods.navigateContent('quotes/q-7');

    expect(navigateContent.mock.calls).toEqual([[''], ['quotes/q-7']]);
  });
});
