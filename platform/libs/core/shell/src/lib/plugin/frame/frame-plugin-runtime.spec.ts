import { TestBed } from '@angular/core/testing';
import { connect } from 'penpal';
import { OpenTabInput } from '@loomweaver/plugin-sdk';
import {
  provideFramePlugins,
  FramePluginRuntime,
} from './frame-plugin-runtime';
import { CAPABILITY_GRANTS } from '../../permissions/provide-capability-grants';
import { CapabilityGrantService } from '../../permissions/capability-grant.service';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { HostContextFactory } from '../context/host-context-factory';
import { COMMAND_INVOKER } from '../../foundation/command-invoker';
import { CommandInvocationService } from '../../commands/command-invocation.service';
import { PluginEnablementService } from '../enablement/plugin-enablement.service';
import { PluginInstallService } from '../../plugin-store/lifecycle/plugin-install.service';
import { PluginDeploymentService } from '../../plugin-store/lifecycle/plugin-deployment.service';
import { CATALOG_MAX_ISOLATION_LEVEL } from '../../plugin-store/catalog/plugin-catalog';
import { ContentTabsService } from '../../regions/content/tabs/content-tabs.service';
import { MenuService } from '../../menu/menu.service';
import { SettingsService } from '../../settings/settings.service';
import type { Mock } from 'vitest';

vi.mock('penpal', () => ({
  connect: vi.fn(),
  WindowMessenger: vi.fn(),
}));

describe('FramePluginRuntime (iframe + Penpal runtime)', () => {
  const connectMock = connect as Mock;
  let tabs: Record<string, Mock>;

  function connectionFor(promise: Promise<unknown>) {
    return { promise, destroy: vi.fn() };
  }

  function setup(
    promise: Promise<unknown> = Promise.resolve({}),
    level?: 'isolated' | 'embedded',
    origins?: readonly string[],
    name?: string,
  ) {
    connectMock.mockReset().mockReturnValue(connectionFor(promise));
    tabs = {
      navigate: vi.fn(),
      open: vi.fn(),
      keep: vi.fn(),
      pin: vi.fn(),
      unpin: vi.fn(),
      close: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: ContentTabsService, useValue: tabs },
        {
          provide: MenuService,
          useValue: { openList: () => undefined } as unknown as MenuService,
        },
        {
          provide: CAPABILITY_GRANTS,
          useValue: { p1: ['contributions', 'ui', 'navigation'] },
        },
        ...provideFramePlugins({
          id: 'p1',
          entryUrl: '/p1/plugin.html',
          capabilities: ['contributions', 'ui', 'navigation'],
          ...(name && { name }),
          ...(level && { level }),
          ...(origins && { origins }),
        }),
      ],
    });
    return {
      runtime: TestBed.inject(FramePluginRuntime),
      registry: TestBed.inject(ContributionRegistry),
    };
  }

  afterEach(() => {
    for (const frame of document.querySelectorAll('iframe')) {
      frame.remove();
    }
    localStorage.clear();
  });

  function rpc() {
    return connectMock.mock.calls[0][0].methods as Record<
      string,
      (...args: unknown[]) => unknown
    >;
  }

  it('spawns a hidden sandbox iframe per plugin and opens a Penpal connection', () => {
    const { runtime } = setup();
    runtime.activateAll();

    const frame = document.querySelector('iframe');
    expect(frame?.getAttribute('sandbox')).toBe('allow-scripts');
    expect(frame?.getAttribute('src')).toContain('/p1/plugin.html');
    expect(connectMock).toHaveBeenCalledTimes(1);
  });

  it('an embedded plugin keeps an origin — the frame is not stripped of one', () => {
    const { runtime } = setup(Promise.resolve({}), 'embedded');
    runtime.activateAll();

    const frame = document.querySelector('iframe');
    expect(frame?.getAttribute('sandbox')).toBeNull();
    expect(frame?.getAttribute('src')).toContain('/p1/plugin.html');
  });

  it('the same plugin reaches the same contract and the same broker at either level', () => {
    const { runtime, registry } = setup(Promise.resolve({}), 'embedded');
    runtime.activateAll();
    const grants = TestBed.inject(CapabilityGrantService);

    rpc()['registerSurface']({
      id: 'p1.view',
      title: 'p1.title',
      iframe: '/p1/view.html',
      routable: { path: 'embedded-x' },
    });

    expect(registry.contentRoutes().map((r) => r.path)).toContain('embedded-x');
    expect(grants.isGranted('p1', 'contributions')).toBe(true);
    expect(grants.isGranted('p1', 'theme')).toBe(false);
  });

  it('the recommended arrangement works end to end: embedded, from a sibling origin', () => {
    const { runtime, registry } = setup(Promise.resolve({}), 'embedded', [
      'https://treaties.example.com',
    ]);
    runtime.activateAll();

    expect(
      document.querySelector('iframe')?.getAttribute('sandbox'),
    ).toBeNull();

    rpc()['registerSurface']({
      id: 'p1.view',
      title: 'p1.title',
      iframe: 'https://treaties.example.com/view.html',
      routable: { path: 'treaties' },
    });

    expect(registry.contentRoutes().map((r) => r.path)).toContain('treaties');
  });

  it('an embedded plugin still cannot reach an origin nobody permitted', () => {
    const { runtime } = setup(Promise.resolve({}), 'embedded', [
      'https://treaties.example.com',
    ]);
    runtime.activateAll();

    expect(() =>
      rpc()['registerSurface']({
        id: 'p1.view',
        title: 'p1.title',
        iframe: 'https://billing.example.com/view.html',
        routable: { path: 'billing' },
      }),
    ).toThrow(/permitted/);
  });

  it('an entry asking at or below the cap runs at what it asked for', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: CATALOG_MAX_ISOLATION_LEVEL, useValue: 'embedded' },
      ],
    });
    const { runtime } = setup();
    runtime.activateAll();
    TestBed.inject(PluginDeploymentService).adopt([
      {
        id: 'p2',
        name: 'Team app',
        entryUrl: '/p2/plugin.html',
        capabilities: ['contributions'],
        level: 'embedded',
        deployed: true,
      },
    ]);
    TestBed.tick();

    const frames = [...document.querySelectorAll('iframe')];
    expect(frames).toHaveLength(2);
    expect(frames[1]?.getAttribute('sandbox')).toBeNull();
  });

  it('an entry asking above the cap is refused outright, not run at the cap, and said so once', () => {
    const { runtime } = setup();
    runtime.activateAll();
    const reported = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const deployment = TestBed.inject(PluginDeploymentService);
    const refused = {
      id: 'p2',
      name: 'Team app',
      entryUrl: '/p2/plugin.html',
      capabilities: ['contributions'],
      level: 'embedded',
      deployed: true,
    } as const;

    deployment.adopt([refused]);
    TestBed.tick();
    deployment.adopt([
      refused,
      { id: 'p3', name: 'Other', entryUrl: '/p3/plugin.html', deployed: true },
    ]);
    TestBed.tick();

    expect(document.querySelectorAll('iframe')).toHaveLength(2);
    expect(reported).toHaveBeenCalledOnce();
    reported.mockRestore();
  });

  it('an entry that asks for nothing runs isolated even where the cap allows more', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: CATALOG_MAX_ISOLATION_LEVEL, useValue: 'embedded' },
      ],
    });
    const { runtime } = setup();
    runtime.activateAll();
    TestBed.inject(PluginDeploymentService).adopt([
      {
        id: 'p2',
        name: 'Team app',
        entryUrl: '/p2/plugin.html',
        capabilities: ['contributions'],
        deployed: true,
      },
    ]);
    TestBed.tick();

    const frames = [...document.querySelectorAll('iframe')];
    expect(frames[1]?.getAttribute('sandbox')).toBe('allow-scripts');
  });

  it('activateAll is idempotent — an already-spawned plugin is not spawned twice', () => {
    const { runtime } = setup();
    runtime.activateAll();
    runtime.activateAll();
    expect(connectMock).toHaveBeenCalledTimes(1);
  });

  it('routes the registerSurface RPC through the broker into the registry', () => {
    const { runtime, registry } = setup();
    runtime.activateAll();

    rpc()['registerSurface']({
      id: 'p1.view',
      title: 'p1.title',
      iframe: '/p1/view.html',
      routable: { path: 'sandbox-x' },
    });

    expect(registry.contentRoutes().map((r) => r.path)).toContain('sandbox-x');
  });

  it('lets a rest declaration cross the RPC seam', () => {
    const { runtime, registry } = setup();
    runtime.activateAll();

    rpc()['registerSurface']({
      id: 'p1.view',
      title: 'p1.title',
      iframe: '/p1/view.html',
      routable: { path: 'sandbox-x', rest: true },
    });

    expect(registry.contentRoutes()[0].rest).toBe(true);
  });

  it('pushes a watched state key back over the runtime channel', async () => {
    const remote = { stateChanged: vi.fn() };
    const { runtime } = setup(Promise.resolve(remote));
    runtime.activateAll();
    await Promise.resolve();

    rpc()['stateWatch']('step-1');
    TestBed.tick();
    await Promise.resolve();
    expect(remote.stateChanged).toHaveBeenCalledWith('step-1', undefined, true);

    rpc()['stateSet']('step-1', { note: 'typed' });
    TestBed.tick();
    await Promise.resolve();

    expect(remote.stateChanged).toHaveBeenLastCalledWith(
      'step-1',
      { note: 'typed' },
      true,
    );
  });

  it('routes the registerMenuItem RPC into the registry', () => {
    const { runtime, registry } = setup();
    runtime.activateAll();

    rpc()['registerMenuItem']({
      menu: 'content/tab/context',
      command: 'p1.do',
    });

    expect(
      registry
        .menuItems()
        .some((index) => index.menu === 'content/tab/context'),
    ).toBe(true);
  });

  it('delegates the navigation RPCs to the content-tabs service', () => {
    const { runtime } = setup();
    runtime.activateAll();
    const methods = rpc();

    methods['navigateContent']('a');
    methods['openContentTab']({ path: 'b' });
    methods['keepContentTab']('c');
    methods['pinContentTab']('d');
    methods['unpinContentTab']('e');
    methods['closeContentTab']('f');

    expect(tabs['navigate']).toHaveBeenCalledWith('a');
    expect(tabs['open']).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'b',
        title: 'b',
        onClose: expect.any(Function),
      }),
    );
    expect(tabs['keep']).toHaveBeenCalledWith('c');
    expect(tabs['pin']).toHaveBeenCalledWith('d');
    expect(tabs['unpin']).toHaveBeenCalledWith('e');
    expect(tabs['close']).toHaveBeenCalledWith('f');
  });

  it("openContentTab's close hook notifies the plugin runtime via contentTabClosed", async () => {
    const remote = { contentTabClosed: vi.fn(), settingsChanged: vi.fn() };
    const { runtime } = setup(Promise.resolve(remote));
    runtime.activateAll();

    rpc()['openContentTab']({ path: 'b' });
    const input = tabs['open'].mock.calls[0][0] as OpenTabInput;
    input.onClose?.();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    expect(remote.contentTabClosed).toHaveBeenCalledWith('b');
  });

  it('returns a toast id from the toast RPC (ui grant)', () => {
    const { runtime } = setup();
    runtime.activateAll();

    const id = rpc()['toast']({ message: 'hi' });

    expect(typeof id).toBe('string');
  });

  it('deactivate tears down the frame, the connection and the contributions', () => {
    const { runtime, registry } = setup();
    runtime.activateAll();
    rpc()['registerSurface']({
      id: 'p1.view',
      title: 'p1.title',
      iframe: '/p1/view.html',
      routable: { path: 'sandbox-x' },
    });
    const connection = connectMock.mock.results[0].value;

    runtime.deactivate('p1');

    expect(connection.destroy).toHaveBeenCalled();
    expect(document.querySelector('iframe')).toBeNull();
    expect(registry.contentRoutes()).toHaveLength(0);
  });

  it('deactivate is a no-op for an unknown plugin id', () => {
    const { runtime } = setup();
    runtime.activateAll();
    expect(() => runtime.deactivate('nope')).not.toThrow();
    expect(document.querySelector('iframe')).not.toBeNull();
  });

  it('deactivateAll tears down every plugin', () => {
    const { runtime } = setup();
    runtime.activateAll();
    runtime.deactivateAll();
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('routes registerSettingsSection through the broker — a composed frame plugin lands under App plugins', async () => {
    const settingsChanged = vi.fn();
    const { runtime } = setup(Promise.resolve({ settingsChanged }));
    runtime.activateAll();

    rpc()['registerSettingsSection']({
      id: 'prefs',
      title: 'P1 prefs',
      rows: [
        {
          id: 'greeting',
          label: 'Greeting',
          control: { kind: 'text', value: 'Hello' },
        },
      ],
    });
    await Promise.resolve();
    await Promise.resolve();

    const settings = TestBed.inject(SettingsService);
    const section = settings.all().find((entry) => entry.id === 'p1.prefs');
    expect(section?.group).toBe('settings.group.plugins');
    expect(settingsChanged).toHaveBeenCalledWith('prefs', {
      greeting: 'Hello',
    });

    runtime.deactivate('p1');
    expect(
      settings.all().find((entry) => entry.id === 'p1.prefs'),
    ).toBeUndefined();
  });

  it('an installed plugin’s settings section lands under Community plugins', async () => {
    const { runtime } = setup();
    runtime.activateAll();
    TestBed.inject(PluginInstallService).install({
      id: 'p2',
      name: 'Store plugin',
      entryUrl: '/p2/plugin.html',
      capabilities: ['contributions'],
    });
    TestBed.tick();

    const p2Rpc = connectMock.mock.calls[1][0].methods as Record<
      string,
      (arg?: unknown) => void
    >;
    p2Rpc['registerSettingsSection']({
      id: 'prefs',
      title: 'Store plugin',
      rows: [
        {
          id: 'loud',
          label: 'Shout',
          control: { kind: 'toggle', value: false },
        },
      ],
    });

    const section = TestBed.inject(SettingsService)
      .all()
      .find((entry) => entry.id === 'p2.prefs');
    expect(section?.group).toBe('settings.group.community');
  });

  it('lists a composed plugin under its identifier when the composition names none', () => {
    const { runtime } = setup();
    runtime.activateAll();

    expect(
      TestBed.inject(PluginEnablementService)
        .plugins()
        .find((plugin) => plugin.id === 'p1')?.name,
    ).toBe('p1');
  });

  it('lists a composed plugin under the name the composition gave it, keyed by identifier', () => {
    const { runtime } = setup(
      undefined,
      undefined,
      undefined,
      'Payment matching',
    );
    runtime.activateAll();

    const listed = TestBed.inject(PluginEnablementService)
      .plugins()
      .find((plugin) => plugin.id === 'p1');
    expect(listed?.name).toBe('Payment matching');
    expect(
      TestBed.inject(CapabilityGrantService).isGranted('p1', 'contributions'),
    ).toBe(true);
  });

  it('spawns a store-installed plugin live with its consent grant and unloads it on uninstall', () => {
    const { runtime } = setup();
    runtime.activateAll();
    const install = TestBed.inject(PluginInstallService);
    const enablement = TestBed.inject(PluginEnablementService);
    const grants = TestBed.inject(CapabilityGrantService);

    install.install({
      id: 'p2',
      name: 'Store plugin',
      entryUrl: '/p2/plugin.html',
      capabilities: ['contributions'],
    });
    TestBed.tick();

    expect(connectMock).toHaveBeenCalledTimes(2);
    expect(document.querySelectorAll('iframe')).toHaveLength(2);
    expect(enablement.plugins().map((p) => p.id)).toContain('p2');
    expect(grants.isGranted('p2', 'contributions')).toBe(true);
    expect(grants.isGranted('p2', 'ui')).toBe(false);

    install.uninstall('p2');
    TestBed.tick();

    expect(document.querySelectorAll('iframe')).toHaveLength(1);
    expect(enablement.plugins().map((p) => p.id)).not.toContain('p2');
  });

  it('runs a deployed catalog entry without consent, granting exactly what it names', () => {
    const { runtime } = setup();
    runtime.activateAll();
    const grants = TestBed.inject(CapabilityGrantService);

    TestBed.inject(PluginDeploymentService).adopt([
      {
        id: 'p2',
        name: 'Deployed plugin',
        entryUrl: '/p2/plugin.html',
        capabilities: ['contributions', 'ui'],
        deployed: true,
      },
    ]);
    TestBed.tick();

    expect(document.querySelectorAll('iframe')).toHaveLength(2);
    expect(grants.isGranted('p2', 'contributions')).toBe(true);
    expect(grants.isGranted('p2', 'ui')).toBe(true);
    expect(grants.isGranted('p2', 'navigation')).toBe(false);
  });

  it('unloads a deployed plugin once the catalog stops carrying it', () => {
    const { runtime } = setup();
    runtime.activateAll();
    const deployment = TestBed.inject(PluginDeploymentService);

    deployment.adopt([
      {
        id: 'p2',
        name: 'Deployed plugin',
        entryUrl: '/p2/plugin.html',
        capabilities: ['contributions'],
        deployed: true,
      },
    ]);
    TestBed.tick();
    expect(document.querySelectorAll('iframe')).toHaveLength(2);

    deployment.adopt([]);
    TestBed.tick();
    expect(document.querySelectorAll('iframe')).toHaveLength(1);
  });

  it('a composed plugin still wins an id collision, now against a deployed entry too', () => {
    const { runtime } = setup();
    runtime.activateAll();

    TestBed.inject(PluginDeploymentService).adopt([
      {
        id: 'p1',
        name: 'Impostor',
        entryUrl: '/impostor/plugin.html',
        capabilities: ['contributions'],
        deployed: true,
      },
    ]);
    TestBed.tick();

    const sources = [...document.querySelectorAll('iframe')].map((frame) =>
      frame.getAttribute('src'),
    );
    expect(sources).toHaveLength(1);
    expect(sources[0]).toContain('/p1/plugin.html');
  });

  it('a deployed plugin is not left switched off by a disable stored before it was deployed', () => {
    const { runtime } = setup();
    runtime.activateAll();
    const enablement = TestBed.inject(PluginEnablementService);
    const deployment = TestBed.inject(PluginDeploymentService);

    deployment.adopt([
      {
        id: 'p2',
        name: 'Deployed plugin',
        entryUrl: '/p2/plugin.html',
        capabilities: ['contributions'],
        deployed: true,
      },
    ]);
    TestBed.tick();
    expect(document.querySelectorAll('iframe')).toHaveLength(2);

    enablement.setEnabled('p2', false);
    TestBed.tick();

    expect(document.querySelectorAll('iframe')).toHaveLength(2);
  });

  it('a deployed entry wins over the same id the user installed', () => {
    const { runtime } = setup();
    runtime.activateAll();
    const grants = TestBed.inject(CapabilityGrantService);

    TestBed.inject(PluginInstallService).install({
      id: 'p2',
      name: 'Store plugin',
      entryUrl: '/p2/plugin.html',
      capabilities: ['contributions'],
    });
    TestBed.tick();

    TestBed.inject(PluginDeploymentService).adopt([
      {
        id: 'p2',
        name: 'Deployed plugin',
        entryUrl: '/p2/plugin.html',
        capabilities: ['contributions', 'ui'],
        deployed: true,
      },
    ]);
    TestBed.tick();

    expect(document.querySelectorAll('iframe')).toHaveLength(2);
    expect(grants.isGranted('p2', 'ui')).toBe(true);
  });

  it('respawns an installed plugin when its entry changes and grants the new declaration', () => {
    const { runtime } = setup();
    runtime.activateAll();
    const install = TestBed.inject(PluginInstallService);
    const grants = TestBed.inject(CapabilityGrantService);
    install.install({
      id: 'p2',
      name: 'Store plugin',
      entryUrl: '/p2/plugin.html',
      version: '1.0.0',
      capabilities: ['contributions'],
    });
    TestBed.tick();

    install.update({
      id: 'p2',
      name: 'Store plugin',
      entryUrl: '/p2/v2/plugin.html',
      version: '2.0.0',
      capabilities: ['contributions', 'ui'],
    });
    TestBed.tick();

    expect(connectMock).toHaveBeenCalledTimes(3);
    expect(document.querySelectorAll('iframe')).toHaveLength(2);
    expect(
      [...document.querySelectorAll('iframe')].some((frame) =>
        frame.getAttribute('src')?.includes('/p2/v2/'),
      ),
    ).toBe(true);
    expect(grants.isGranted('p2', 'ui')).toBe(true);
  });

  it('respawns on a version-only update — the files behind an unchanged entryUrl are new', () => {
    const { runtime } = setup();
    runtime.activateAll();
    const install = TestBed.inject(PluginInstallService);
    install.install({
      id: 'p2',
      name: 'Store plugin',
      entryUrl: '/p2/plugin.html',
      version: '1.0.0',
      capabilities: ['contributions'],
    });
    TestBed.tick();

    install.update({
      id: 'p2',
      name: 'Store plugin',
      entryUrl: '/p2/plugin.html',
      version: '1.1.0',
      capabilities: ['contributions'],
    });
    TestBed.tick();

    expect(connectMock).toHaveBeenCalledTimes(3);
    expect(document.querySelectorAll('iframe')).toHaveLength(2);
  });

  it('leaves a running plugin alone when an unrelated install changes the set', () => {
    const { runtime } = setup();
    runtime.activateAll();
    const install = TestBed.inject(PluginInstallService);

    install.install({
      id: 'p2',
      name: 'Store plugin',
      entryUrl: '/p2/plugin.html',
      capabilities: ['contributions'],
    });
    TestBed.tick();
    install.install({
      id: 'p3',
      name: 'Another',
      entryUrl: '/p3/plugin.html',
      capabilities: ['contributions'],
    });
    TestBed.tick();

    expect(connectMock).toHaveBeenCalledTimes(3);
    expect(document.querySelectorAll('iframe')).toHaveLength(3);
  });

  it('a persisted install never shadows a composed plugin — the composed one wins', () => {
    localStorage.setItem(
      'lw.shell.installed-plugins',
      JSON.stringify([
        { id: 'p1', name: 'Impostor', entryUrl: '/impostor/plugin.html' },
      ]),
    );
    const { runtime } = setup();
    runtime.activateAll();

    expect(connectMock).toHaveBeenCalledTimes(1);
    expect(document.querySelector('iframe')?.getAttribute('src')).toContain(
      '/p1/plugin.html',
    );
  });

  it('reports and cleans up a failed handshake', async () => {
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const { runtime } = setup(Promise.reject(new Error('bad entry')));
    runtime.activateAll();

    await Promise.resolve();
    await Promise.resolve();

    expect(error).toHaveBeenCalledWith(
      'Sandbox plugin "p1" failed to connect',
      expect.any(Error),
    );
    expect(document.querySelector('iframe')).toBeNull();
    error.mockRestore();
  });
});

describe('FramePluginRuntime command invocation', () => {
  const connectMock = connect as Mock;

  function setup() {
    connectMock
      .mockReset()
      .mockReturnValue({ promise: Promise.resolve({}), destroy: vi.fn() });
    TestBed.configureTestingModule({
      providers: [
        {
          provide: MenuService,
          useValue: { openList: () => undefined } as unknown as MenuService,
        },
        {
          provide: CAPABILITY_GRANTS,
          useValue: { p1: ['contributions', 'automation'] },
        },
        { provide: COMMAND_INVOKER, useExisting: CommandInvocationService },
        ...provideFramePlugins({
          id: 'p1',
          entryUrl: '/p1/plugin.html',
          capabilities: ['contributions', 'automation'],
        }),
      ],
    });
    const registry = TestBed.inject(ContributionRegistry);
    registry.addCommand(
      {
        id: 'other.open',
        title: 'Open',
        description: 'Opens a path',
        callable: true,
        answers: 'The path it opened',
        agentConsent: 'ask-always',
        arguments: [
          { name: 'path', kind: 'text', description: 'Where', required: true },
        ],
        run: (_context, args) => args?.['path'],
      },
      'other-plugin',
    );
    TestBed.inject(FramePluginRuntime).activateAll();
    return connectMock.mock.calls[0][0].methods as Record<
      string,
      (...args: unknown[]) => unknown
    >;
  }

  afterEach(() => {
    for (const frame of document.querySelectorAll('iframe')) {
      frame.remove();
    }
    localStorage.clear();
  });

  it('answers a sandboxed caller exactly as it answers an in-process one', async () => {
    const methods = setup();
    const overRpc = await methods['invokeCommand']('other.open', {
      path: 'a/b',
    });
    const inProcess = await TestBed.inject(HostContextFactory)
      .create('p1', () => true)
      .invokeCommand('other.open', { path: 'a/b' });

    expect(overRpc).toEqual({ outcome: 'answered', value: 'a/b' });
    expect(overRpc).toEqual(inProcess);
  });

  it('lists the same commands over the boundary, with what they say about an agent', () => {
    const methods = setup();

    expect(methods['invocableCommands']()).toEqual([
      {
        id: 'other.open',
        title: 'Open',
        description: 'Opens a path',
        answers: 'The path it opened',
        agentConsent: 'ask-always',
        arguments: [
          { name: 'path', kind: 'text', description: 'Where', required: true },
        ],
      },
    ]);
  });

  it('refuses an argument that could not arrive as the value it was', async () => {
    const methods = setup();

    expect(
      await methods['invokeCommand']('other.open', { path: new Date(0) }),
    ).toMatchObject({ outcome: 'refused', reason: 'invalid-arguments' });
  });

  it('refuses an unknown id the same way it refuses a closed command', async () => {
    const methods = setup();
    TestBed.inject(ContributionRegistry).addCommand(
      { id: 'other.closed', title: 'C', run: vi.fn() },
      'other-plugin',
    );

    expect(await methods['invokeCommand']('nothing.here')).toEqual(
      await methods['invokeCommand']('other.closed'),
    );
  });
});
