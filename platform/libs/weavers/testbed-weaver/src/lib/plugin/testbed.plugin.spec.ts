import {
  BarItem,
  Command,
  ConfirmOptions,
  DialogRef,
  MenuItem,
  OpenTabInput,
  PluginContext,
  ProgressOptions,
  RailItem,
  SettingsSection,
  Surface,
} from '@loomweaver/plugin-sdk';
import { testbedPlugin } from './testbed.plugin';

interface Captured {
  commands: Command[];
  barItems: BarItem[];
  railItems: RailItem[];
  sections: SettingsSection[];
  confirms: ConfirmOptions[];
  icons: Record<string, string>[];
  surfaces: Surface[];
  menuItems: MenuItem[];
  opened: OpenTabInput[];
  navigated: string[];
}

function activate(): Captured {
  const captured: Captured = {
    commands: [],
    barItems: [],
    railItems: [],
    sections: [],
    confirms: [],
    icons: [],
    surfaces: [],
    menuItems: [],
    opened: [],
    navigated: [],
  };
  const disposable = { dispose: () => undefined };
  const capture =
    <T>(into: T[]) =>
    (value: T) => {
      into.push(value);
      return disposable;
    };
  const ctx: PluginContext = {
    registerCommand: capture(captured.commands),
    registerSurface: capture(captured.surfaces),
    retitleSurface: () => undefined,
    isShowingUnder: () => false,
    registerBarItem: capture(captured.barItems),
    registerRailItem: capture(captured.railItems),
    registerSettingsSection: capture(captured.sections),
    contributeIcons: capture(captured.icons),
    registerMenuItem: capture(captured.menuItems),
    navigateContent: (path) => void captured.navigated.push(path),
    openContentTab: (input) => void captured.opened.push(input),
    keepContentTab: () => undefined,
    pinContentTab: () => undefined,
    unpinContentTab: () => undefined,
    closeContentTab: () => undefined,
    invokeCommand: () => Promise.resolve({ outcome: 'answered' as const }),
    invocableCommands: () => [],
    ui: {
      confirm: (options) => {
        captured.confirms.push(options);
        return Promise.resolve(false);
      },
      alert: () => Promise.resolve(),
      prompt: () => Promise.resolve(null),
      open: <R>() => new DialogRef<R>(),
      progress: () => ({ update: () => undefined, close: () => undefined }),
      withProgress: <T>(_options: ProgressOptions, work: Promise<T>) => work,
      toast: () => '',
      openSettings: () => new DialogRef(),
      openMenu: () => undefined,
    },
    host: {
      version: () => '0.0.0',
      isPreview: () => false,
      updateAvailable: () => false,
      updatesEnabled: false,
      checkForUpdate: () => Promise.resolve(),
      activateUpdate: () => Promise.resolve(),
    },
    contributeTheme: () => disposable,
    revealSurface: () => undefined,
    activeContent: () => null,
    session: {
      authenticated: () => false,
      roles: () => [],
      hasRole: () => false,
    },
    state: {
      watch: () => ({
        value: () => undefined,
        loaded: () => true,
        set: () => undefined,
        clear: () => undefined,
        dispose: () => undefined,
      }),
    },
  };
  testbedPlugin.activate(ctx);
  return captured;
}

describe('testbedPlugin', () => {
  it('pins Settings to the foot of the rail', () => {
    const settings = activate().railItems.find(
      (item) => item.id === 'testbed.rail.settings',
    );
    expect(settings?.anchor).toBe('bottom');
    expect(settings?.icon).toBe('settings');
  });

  it('contributes About into the sidebar footer', () => {
    const about = activate().barItems.find(
      (item) => item.id === 'testbed.bar.about',
    );
    expect(about?.bar).toBe('left-footer');
  });

  it('contributes a custom icon and references it on the list surface', () => {
    const captured = activate();
    const list = captured.surfaces.find((s) => s.id === 'testbed.list');
    expect(list?.icon).toBe('testbedList');
    expect(
      captured.icons.some((set) => typeof set['testbedDocument'] === 'string'),
    ).toBe(true);
  });

  it('registers the content model: entry route, dashboard routes, chromeless login', () => {
    const { surfaces } = activate();

    const entry = surfaces.find((s) => s.routable?.path === 'entry/:id');
    expect(entry?.routable?.subRoutes).toEqual([
      'detail',
      'meta',
      'message/:messageId',
    ]);

    const dashboardRoutes = surfaces.filter((s) =>
      s.routable?.path.startsWith('dashboard/'),
    );
    expect(dashboardRoutes).toHaveLength(3);
    expect(dashboardRoutes.every((s) => s.icon !== undefined)).toBe(true);

    const login = surfaces.find((s) => s.routable?.path === 'login');
    expect(login?.routable?.chromeless).toBe(true);

    const list = surfaces.find((s) => s.id === 'testbed.list');
    expect(list?.routable).toBeUndefined();
    expect(list?.docks).toEqual(['left-panel']);
  });

  it('registers the outline as a non-routable panel surface with docks + instanceable', () => {
    const outline = activate().surfaces.find((s) => s.id === 'testbed.outline');
    expect(outline?.routable).toBeUndefined();
    expect(outline?.docks).toEqual(['left-panel']);
    expect(outline?.instanceable).toBe(true);
  });

  it('contributes a Plugins settings section', () => {
    const section = activate().sections.find((s) => s.id === 'testbed.settings');
    expect(section?.group).toBe('settings.group.plugins');
  });

  it('offers the list reset from the navigator it resets, not from the rail', () => {
    const captured = activate();
    const navigator = captured.surfaces.find(
      (surface) => surface.id === 'testbed.nav',
    );
    const reset = navigator?.actions?.find(
      (action) => action.id === 'testbed.nav.reset',
    );

    expect(reset?.command).toBe('testbed.reset');
    expect(reset?.run).toBeUndefined();
    expect(
      captured.railItems.some((item) => item.command === 'testbed.reset'),
    ).toBe(false);
  });

  it('routes Settings, About and the About settings-row through commands (no inline run)', () => {
    const captured = activate();
    const settings = captured.railItems.find(
      (item) => item.id === 'testbed.rail.settings',
    );
    const about = captured.barItems.find(
      (item) => item.id === 'testbed.bar.about',
    );
    const aboutRow = captured.sections
      .find((s) => s.id === 'testbed.settings')
      ?.rows.find((r) => r.id === 'testbed.about');
    expect(settings?.command).toBe('shell.openSettings');
    expect(settings?.run).toBeUndefined();
    expect(about && 'command' in about ? about.command : undefined).toBe(
      'testbed.about',
    );
    expect(
      aboutRow?.control.kind === 'button'
        ? aboutRow.control.command
        : undefined,
    ).toBe('testbed.about');
    expect(captured.commands.some((c) => c.id === 'testbed.openSettings')).toBe(
      true,
    );
    expect(captured.commands.some((c) => c.id === 'testbed.about')).toBe(true);
  });

  it('lets a surface action and a status-bar button share one nav.add command', () => {
    const captured = activate();
    const action = captured.surfaces
      .find((s) => s.id === 'testbed.nav')
      ?.actions?.find((a) => a.id === 'testbed.nav.add');
    const statusButton = captured.barItems.find(
      (item) => item.id === 'testbed.add',
    );
    expect(action?.command).toBe('testbed.nav.add');
    expect(
      statusButton && 'command' in statusButton
        ? statusButton.command
        : undefined,
    ).toBe('testbed.nav.add');
    expect(captured.commands.some((c) => c.id === 'testbed.nav.add')).toBe(true);
  });

  it('guards the destructive reset: only the exact token confirms, else blocks silently', async () => {
    const captured = activate();
    await captured.commands.find((c) => c.id === 'testbed.reset')?.run();
    const guard = captured.confirms[0]?.requireConfirmation;
    expect(captured.confirms[0]?.tone).toBe('danger');
    expect(guard?.validate('Reset')).toBeNull();
    expect(guard?.validate('reset')).toBe('');
  });

  it('contributes an item to the host tab context menu, shown only on closable tabs', () => {
    const captured = activate();
    const item = captured.menuItems.find(
      (m) => m.menu === 'content/tab/context',
    );
    expect(item).toMatchObject({
      command: 'testbed.tab.reveal',
      when: { closable: true },
    });
    expect(captured.commands.some((c) => c.id === 'testbed.tab.reveal')).toBe(
      true,
    );
  });
});
