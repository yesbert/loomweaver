import { TestBed } from '@angular/core/testing';
import { NotificationInput } from '@loomweaver/plugin-sdk';
import { NoticeBoard } from '../../../notifications/notice-board';
import { HostPluginContext } from '../../context/host-plugin-context';
import { KeyValueStore } from '../../../persistence/key-value-store';
import { StateSyncService } from '../../../persistence/cross-tab/state-sync.service';
import { PluginInstallService } from '../../../plugin-store/lifecycle/plugin-install.service';
import { FrameSession } from '../frame-session';
import { FrameRpcDeps, frameRpcMethods } from './frame-rpc-methods';

function methodsFor(
  ctx: Partial<HostPluginContext>,
  session = {},
  overrides: Partial<FrameRpcDeps> = {},
) {
  return frameRpcMethods({
    pluginId: 'framed',
    ctx: ctx as HostPluginContext,
    origins: undefined,
    session: session as FrameSession,
    install: {} as PluginInstallService,
    store: {} as KeyValueStore,
    sync: {} as StateSyncService,
    notices: {} as NoticeBoard,
    reportRefusal: () => undefined,
    ...overrides,
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

describe("frameRpcMethods — an isolated plugin's toasts are bounded", () => {
  const asToast = (raw: object) => raw as NotificationInput;

  function setup() {
    const notices = TestBed.inject(NoticeBoard);
    const reportRefusal = vi.fn();
    const ui = {
      toast: (input: NotificationInput) => notices.raise(input, 'framed'),
    };
    const methods = methodsFor(
      { ui } as Partial<HostPluginContext>,
      {},
      { notices, reportRefusal },
    );
    const shown = () => notices.shown().map((notice) => notice.message);
    return { notices, reportRefusal, methods, shown };
  }

  function raiseThree(
    methods: ReturnType<typeof methodsFor>,
    timeoutMs?: number,
  ): void {
    for (const message of ['one', 'two', 'three']) {
      methods.toast(asToast({ message, timeoutMs }));
    }
  }

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('lets a toast stated to stay leave after the longest lifetime', () => {
    const { methods, shown } = setup();
    methods.toast(asToast({ message: 'forever', timeoutMs: 0 }));

    vi.advanceTimersByTime(14_999);
    expect(shown()).toEqual(['forever']);
    vi.advanceTimersByTime(1);
    expect(shown()).toEqual([]);
  });

  it('lets an error without a lifetime leave too', () => {
    const { methods, shown } = setup();
    methods.toast(asToast({ message: 'failed', kind: 'error' }));

    vi.advanceTimersByTime(15_000);
    expect(shown()).toEqual([]);
  });

  it('refuses and reports a fourth toast, leaving the three held as they are', () => {
    const { methods, shown, reportRefusal } = setup();
    raiseThree(methods);

    expect(() => methods.toast(asToast({ message: 'four' }))).toThrow(
      /already holds 3 toasts/,
    );
    expect(reportRefusal).toHaveBeenCalledTimes(1);
    expect(shown()).toEqual(['one', 'two', 'three']);
  });

  it('takes a repeat and a replacement while the plugin holds three', () => {
    const { methods, notices } = setup();
    methods.toast(asToast({ message: 'one' }));
    methods.toast(asToast({ message: 'two' }));
    methods.toast(asToast({ id: 'named', message: 'three' }));

    methods.toast(asToast({ message: 'one' }));
    methods.toast(asToast({ id: 'named', message: 'three, updated' }));

    expect(notices.shown().map((notice) => notice.count)).toEqual([2, 1, 1]);
    expect(notices.shown()[2].message).toBe('three, updated');
  });

  it("counts waiting toasts too, so the application's own are not crowded out", () => {
    const { methods, notices } = setup();
    notices.raise({ id: 'own', message: 'own', timeoutMs: 0 });
    raiseThree(methods);

    expect(() => methods.toast(asToast({ message: 'four' }))).toThrow();
  });

  it("shows the workbench's own toast once the plugin's three before it have left", () => {
    const { methods, notices, shown } = setup();
    raiseThree(methods, 0);
    notices.raise({ message: 'A version is waiting', timeoutMs: 0 });
    expect(shown()).not.toContain('A version is waiting');

    vi.advanceTimersByTime(15_000);
    expect(shown()).toEqual(['A version is waiting']);
  });

  it('has room again when a held toast has left', () => {
    const { methods, shown } = setup();
    raiseThree(methods, 1000);
    vi.advanceTimersByTime(1000);

    methods.toast(asToast({ message: 'four' }));
    expect(shown()).toEqual(['four']);
  });
});
