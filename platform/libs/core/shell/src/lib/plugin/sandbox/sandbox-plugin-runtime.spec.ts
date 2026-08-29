import { TestBed } from '@angular/core/testing';
import { connect } from 'penpal';
import {
  MenuItem,
  NotificationInput,
  OpenTabInput,
  Surface,
} from '@loomweaver/plugin-sdk';
import {
  provideFramePlugins,
  FramePluginRuntime,
} from './sandbox-plugin-runtime';
import {
  sanitizeRpcMenuItem,
  sanitizeRpcSurface,
  sanitizeRpcTabInput,
  sanitizeRpcToastInput,
} from './sandbox-rpc-sanitize';
import {
  effectiveCapabilities,
  CAPABILITY_GRANTS,
} from '../../permissions/capability-grants';
import { CapabilityGrantService } from '../../permissions/capability-grant.service';
import { ContributionRegistry } from '../contribution-registry';
import { HostContextFactory } from '../host-context-factory';
import { COMMAND_INVOKER } from '../../foundation/command-invoker';
import { CommandInvocationService } from '../../commands/command-invocation.service';
import { PluginEnablementService } from '../../plugin-store/lifecycle/plugin-enablement.service';
import { PluginInstallService } from '../../plugin-store/lifecycle/plugin-install.service';
import { PluginDeploymentService } from '../../plugin-store/lifecycle/plugin-deployment.service';
import { CATALOG_MAX_ISOLATION_LEVEL } from '../../foundation/plugin-isolation-level';
import { ContentTabsService } from '../../regions/content/tabs/content-tabs.service';
import { MenuService } from '../../menu/menu.service';
import { SettingsService } from '../../settings/settings.service';
import type { Mock } from 'vitest';

vi.mock('penpal', () => ({
  connect: vi.fn(),
  WindowMessenger: vi.fn(),
}));

function asSurface(raw: unknown): Surface {
  return raw as Surface;
}

function validSurface(overrides: Record<string, unknown> = {}): Surface {
  return asSurface({
    id: 'testbed.view',
    title: 'testbed.title',
    iframe: '/demo/view.html',
    routable: { path: 'a' },
    ...overrides,
  });
}

function asTabInput(raw: unknown): OpenTabInput {
  return raw as OpenTabInput;
}

function asMenuItem(raw: unknown): MenuItem {
  return raw as MenuItem;
}

describe('sanitizeRpcSurface', () => {
  it('accepts the { iframe } surface form with a same-origin URL and rebuilds it field by field', () => {
    const surface = sanitizeRpcSurface(
      'testbed',
      asSurface({
        id: 'sandbox-rpc.view',
        title: 'testbed.sandbox.title',
        icon: 'testbedSandbox',
        iframe: '/sandbox-rpc/view.html',
        routable: {
          path: 'sandbox-rpc',
          subRoutes: ['overview', 'architecture'],
        },
        smuggled: () => 'nope',
      }),
    );

    expect(surface).toEqual({
      id: 'sandbox-rpc.view',
      title: 'testbed.sandbox.title',
      icon: 'testbedSandbox',
      order: undefined,
      iframe: '/sandbox-rpc/view.html',
      routable: {
        path: 'sandbox-rpc',
        subRoutes: ['overview', 'architecture'],
        title: undefined,
        titleIsLiteral: undefined,
        icon: undefined,
        chromeless: undefined,
      },
    });
    expect('smuggled' in surface).toBe(false);
  });

  it('keeps chromeless but drops junk-typed fields', () => {
    const surface = sanitizeRpcSurface(
      'testbed',
      validSurface({
        routable: {
          path: 'sandbox-login',
          chromeless: true,
          subRoutes: ['ok', 42, null],
        },
      }),
    );

    expect(surface.routable?.chromeless).toBe(true);
    expect(surface.routable?.subRoutes).toEqual(['ok']);
  });

  it('carries retain and saveOn through, so the host warning for an inert saveOn can fire', () => {
    const surface = sanitizeRpcSurface(
      'testbed',
      validSurface({ retain: 'always', saveOn: 'hide' }),
    );
    expect(surface.retain).toBe('always');
    expect(surface.saveOn).toBe('hide');

    const junk = sanitizeRpcSurface(
      'testbed',
      validSurface({ retain: 'later', saveOn: 'close' }),
    );
    expect(junk.retain).toBeUndefined();
    expect(junk.saveOn).toBeUndefined();
  });

  it('rejects a missing or empty id', () => {
    expect(() =>
      sanitizeRpcSurface('testbed', validSurface({ id: undefined })),
    ).toThrow(/'id'/);
    expect(() =>
      sanitizeRpcSurface('testbed', validSurface({ id: '' })),
    ).toThrow(/'id'/);
  });

  it('rejects a missing or empty title', () => {
    expect(() =>
      sanitizeRpcSurface('testbed', validSurface({ title: undefined })),
    ).toThrow(/'title'/);
    expect(() =>
      sanitizeRpcSurface('testbed', validSurface({ title: '' })),
    ).toThrow(/'title'/);
  });

  it('rejects a surface that is neither routable nor docked — it has nowhere to go', () => {
    expect(() =>
      sanitizeRpcSurface('testbed', validSurface({ routable: undefined })),
    ).toThrow(/routable\.path/);
    expect(() =>
      sanitizeRpcSurface('testbed', validSurface({ routable: { path: '' } })),
    ).toThrow(/routable\.path/);
  });

  it('accepts a docked surface with no address and carries docks through', () => {
    const surface = sanitizeRpcSurface(
      'testbed',
      validSurface({
        routable: undefined,
        docks: ['secondary', 42, 'primary'],
        instanceable: true,
      }),
    );

    expect(surface.docks).toEqual(['secondary', 'primary']);
    expect(surface.routable).toBeUndefined();
    expect(surface.instanceable).toBe(true);
  });

  it('accepts a container spec, but only on a routable surface', () => {
    const surface = sanitizeRpcSurface(
      'testbed',
      validSurface({
        iframe: undefined,
        container: { children: ['a', 7, 'b'], initial: ['a'] },
      }),
    );
    expect(surface.container).toEqual({ children: ['a', 'b'], initial: ['a'] });

    expect(() =>
      sanitizeRpcSurface(
        'testbed',
        validSurface({
          iframe: undefined,
          routable: undefined,
          docks: ['primary'],
          container: { children: [] },
        }),
      ),
    ).toThrow(/container surface must be routable/);
  });

  it('carries a declared arrangement across the seam, rebuilt node by node', () => {
    const surface = sanitizeRpcSurface(
      'testbed',
      validSurface({
        iframe: undefined,
        container: {
          children: ['graph', 'monitor'],
          initial: {
            columns: [
              { size: 60, tabs: ['graph'], smuggled: () => 'nope' },
              {
                rows: [
                  {
                    tabs: [
                      { surface: 'monitor', active: true, closable: false },
                    ],
                  },
                  { tabs: [42, { closable: false }] },
                ],
              },
            ],
          },
        },
      }),
    );

    expect(surface.container?.initial).toEqual({
      columns: [
        { size: 60, tabs: ['graph'] },
        {
          rows: [
            { tabs: [{ surface: 'monitor', active: true, closable: false }] },
            { tabs: [] },
          ],
        },
      ],
    });
  });

  it('stops at a bounded depth rather than recursing into what a plugin sends', () => {
    let area: unknown = { tabs: ['graph'] };
    for (let depth = 0; depth < 20; depth += 1) {
      area = { rows: [area] };
    }

    const surface = sanitizeRpcSurface(
      'testbed',
      validSurface({
        iframe: undefined,
        container: { children: ['graph'], initial: area },
      }),
    );

    expect(JSON.stringify(surface.container?.initial)).not.toContain('tabs');
  });

  it('still rejects access — a sandboxed surface gates itself', () => {
    expect(() =>
      sanitizeRpcSurface(
        'testbed',
        validSurface({ access: { anyRole: ['admin'] } }),
      ),
    ).toThrow(/'access'/);
  });

  it('rejects the component surface form (and anything without an iframe URL)', () => {
    expect(() =>
      sanitizeRpcSurface(
        'testbed',
        validSurface({ iframe: undefined, component: class {} }),
      ),
    ).toThrow(/iframe/);
    expect(() =>
      sanitizeRpcSurface('testbed', validSurface({ component: class {} })),
    ).toThrow(/iframe/);
    expect(() =>
      sanitizeRpcSurface('testbed', validSurface({ iframe: undefined })),
    ).toThrow(/iframe/);
  });

  it('rejects a foreign-origin, javascript: or data: surface URL', () => {
    expect(() =>
      sanitizeRpcSurface(
        'testbed',
        validSurface({ iframe: 'https://evil.example/phish.html' }),
      ),
    ).toThrow(/permitted/);
    expect(() =>
      sanitizeRpcSurface(
        'testbed',
        validSurface({ iframe: '//evil.example/phish.html' }),
      ),
    ).toThrow(/permitted/);
    const scriptUrl = 'javascript:alert(1)';
    expect(() =>
      sanitizeRpcSurface('testbed', validSurface({ iframe: scriptUrl })),
    ).toThrow(/permitted/);
    expect(() =>
      sanitizeRpcSurface(
        'testbed',
        validSurface({ iframe: 'data:text/html,<h1>hi</h1>' }),
      ),
    ).toThrow(/permitted/);
  });

  it('accepts a surface from an origin the composition permitted for the plugin', () => {
    const surface = sanitizeRpcSurface(
      'treaties',
      validSurface({ iframe: 'https://treaties.example.com/view.html' }),
      ['https://treaties.example.com'],
    );

    expect(surface.iframe).toBe('https://treaties.example.com/view.html');
  });

  it('still refuses an origin that was not permitted, and the own origin still needs no permit', () => {
    expect(() =>
      sanitizeRpcSurface(
        'treaties',
        validSurface({ iframe: 'https://billing.example.com/view.html' }),
        ['https://treaties.example.com'],
      ),
    ).toThrow(/permitted/);
    expect(
      sanitizeRpcSurface('treaties', validSurface({ iframe: '/own/view.html' }), [
        'https://treaties.example.com',
      ]).iframe,
    ).toBe('/own/view.html');
  });

  it('refuses an executing or inline address however many origins were permitted', () => {
    const scriptUrl = 'javascript:alert(1)';
    expect(() =>
      sanitizeRpcSurface('treaties', validSurface({ iframe: scriptUrl }), [
        'https://treaties.example.com',
      ]),
    ).toThrow(/permitted/);
    expect(() =>
      sanitizeRpcSurface(
        'treaties',
        validSurface({ iframe: 'data:text/html,<h1>hi</h1>' }),
        ['https://treaties.example.com'],
      ),
    ).toThrow(/permitted/);
  });

  it('ignores a permitted entry that is not an http(s) origin', () => {
    expect(() =>
      sanitizeRpcSurface(
        'treaties',
        validSurface({ iframe: 'data:text/html,<h1>hi</h1>' }),
        ['data:', 'null', 'not a url'],
      ),
    ).toThrow(/permitted/);
  });
});

describe('sanitizeRpcTabInput', () => {
  it('keeps the plain fields and carries titleIsLiteral + preview through', () => {
    const input = sanitizeRpcTabInput(
      asTabInput({
        path: 'doc/a',
        title: 'A.ts',
        icon: 'testbedDocument',
        titleIsLiteral: true,
        preview: true,
      }),
    );

    expect(input).toEqual({
      path: 'doc/a',
      title: 'A.ts',
      icon: 'testbedDocument',
      titleIsLiteral: true,
      preview: true,
    });
  });

  it('drops a proxied onClose function so no host-side callback crosses the wire', () => {
    const input = sanitizeRpcTabInput(
      asTabInput({ path: 'doc/a', title: 'A.ts', onClose: () => 'nope' }),
    );

    expect('onClose' in input).toBe(false);
  });

  it('defaults a missing title to the path and rejects a missing path', () => {
    expect(sanitizeRpcTabInput(asTabInput({ path: 'doc/a' })).title).toBe(
      'doc/a',
    );
    expect(() => sanitizeRpcTabInput(asTabInput({ title: 'x' }))).toThrow(
      /path/,
    );
  });
});

describe('sanitizeRpcToastInput', () => {
  const asToast = (raw: object) => raw as NotificationInput;

  it('rebuilds a literal from the known fields and drops junk shapes', () => {
    const input = sanitizeRpcToastInput(
      asToast({
        message: 'hello',
        kind: 'success',
        timeoutMs: 2000,
        id: 'greet',
        action: { label: 'x', run: () => 'nope' },
        extra: { nested: true },
      }),
    );

    expect(input).toEqual({
      message: 'hello',
      kind: 'success',
      timeoutMs: 2000,
      id: 'greet',
    });
    expect('action' in input).toBe(false);
  });

  it('drops an unknown kind and a non-finite timeout', () => {
    const input = sanitizeRpcToastInput(
      asToast({ message: 'm', kind: 'shiny', timeoutMs: NaN }),
    );

    expect(input.kind).toBeUndefined();
    expect(input.timeoutMs).toBeUndefined();
  });

  it('rejects a missing or empty message', () => {
    expect(() => sanitizeRpcToastInput(asToast({}))).toThrow(/message/);
    expect(() => sanitizeRpcToastInput(asToast({ message: '' }))).toThrow(
      /message/,
    );
  });
});

describe('sanitizeRpcMenuItem', () => {
  it('rebuilds a menu item from plain fields and drops an inline run function', () => {
    const item = sanitizeRpcMenuItem(
      asMenuItem({
        menu: 'content/tab/context',
        command: 'testbed.tab.reveal',
        order: 0,
        when: { closable: true, extra: { nested: 1 } },
        run: () => 'nope',
      }),
    );

    expect(item).toEqual({
      menu: 'content/tab/context',
      command: 'testbed.tab.reveal',
      title: undefined,
      order: 0,
      when: { closable: true },
    });
    expect('run' in item).toBe(false);
  });

  it('rejects a missing or empty menu slot', () => {
    expect(() => sanitizeRpcMenuItem(asMenuItem({ command: 'x' }))).toThrow(
      /menu/,
    );
    expect(() =>
      sanitizeRpcMenuItem(asMenuItem({ menu: '', command: 'x' })),
    ).toThrow(/menu/);
  });

  it('passes id and checkedWhen through as plain data', () => {
    const item = sanitizeRpcMenuItem(
      asMenuItem({
        id: 'menu:shell.tab.close',
        menu: 'content/tab/context',
        command: 'x',
        checkedWhen: { pinned: true },
      }),
    );
    expect(item.id).toBe('menu:shell.tab.close');
    expect(item.checkedWhen).toEqual({ pinned: true });

    const noId = sanitizeRpcMenuItem(
      asMenuItem({ menu: 'content/tab/context', command: 'x', id: 42 }),
    );
    expect(noId.id).toBeUndefined();
  });
});

describe('effectiveCapabilities', () => {
  it('intersects the grant with the declaration — an undeclared grant is inert', () => {
    const effective = effectiveCapabilities(
      'p',
      ['contributions', 'navigation'],
      ['contributions'],
    );

    expect(effective.has('contributions')).toBe(true);
    expect(effective.has('navigation')).toBe(false);
  });

  it('keeps the grant as-is when the plugin declares nothing (declaring is optional today)', () => {
    const effective = effectiveCapabilities(
      'p',
      ['contributions', 'ui'],
      undefined,
    );

    expect(effective.has('contributions')).toBe(true);
    expect(effective.has('ui')).toBe(true);
  });

  it('is empty for a missing grant (default-deny)', () => {
    expect(effectiveCapabilities('p', undefined, ['contributions']).size).toBe(
      0,
    );
  });
});

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
    document.querySelectorAll('iframe').forEach((f) => f.remove());
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

    expect(document.querySelector('iframe')?.getAttribute('sandbox')).toBeNull();

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

  it('an entry asking above the cap is refused outright, not run at the cap', () => {
    const { runtime } = setup();
    runtime.activateAll();
    const reported = vi.spyOn(console, 'error').mockImplementation(() => undefined);

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

    expect(document.querySelectorAll('iframe')).toHaveLength(1);
    expect(reported).toHaveBeenCalled();
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
      registry.menuItems().some((i) => i.menu === 'content/tab/context'),
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
    const { runtime } = setup(undefined, undefined, undefined, 'Payment matching');
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
    document.querySelectorAll('iframe').forEach((f) => f.remove());
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

  it('lists the same commands over the boundary', () => {
    const methods = setup();

    expect(methods['invocableCommands']()).toEqual([
      {
        id: 'other.open',
        title: 'Open',
        description: 'Opens a path',
        answers: 'The path it opened',
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
