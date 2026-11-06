import { TestBed } from '@angular/core/testing';
import { connect } from 'penpal';
import type { Mock } from 'vitest';
import { CAPABILITY_GRANTS } from '../../permissions/provide-capability-grants';
import { ContentTabsService } from '../../regions/content/tabs/content-tabs.service';
import { MenuService } from '../../menu/menu.service';
import { FailedPluginContent } from '../failed-plugin-content';
import { FramePluginRuntime, provideFramePlugins } from './frame-plugin-runtime';
import { FRAME_PLUGIN_ADDRESSES_KEY } from './frame-plugin-addresses';
import { SETTINGS_STORE } from '../../persistence/settings-store';
import { WORKING_STATE_STORE } from '../../persistence/working-state-store';
import { KeyValueStore } from '../../persistence/key-value-store';

vi.mock('penpal', () => ({
  connect: vi.fn(),
  WindowMessenger: vi.fn(),
}));

const connectMock = connect as Mock;

function connecting(promise: Promise<unknown>) {
  return { promise, destroy: vi.fn() };
}

function memoryStore(values = new Map<string, string>()): KeyValueStore {
  return {
    peek: (key) => values.get(key),
    get: (key) => Promise.resolve(values.get(key)),
    set: (key, value) => {
      values.set(key, value);
      return Promise.resolve();
    },
    delete: (key) => {
      values.delete(key);
      return Promise.resolve();
    },
  };
}

function rememberedPlugins(workingState: Map<string, string>): string[] {
  return Object.keys(
    JSON.parse(workingState.get(FRAME_PLUGIN_ADDRESSES_KEY) ?? '{}'),
  );
}

function session(
  answer: Promise<unknown>,
  workingState: Map<string, string>,
  settings: KeyValueStore = memoryStore(),
) {
  TestBed.resetTestingModule();
  answer.catch(() => undefined);
  connectMock.mockReset().mockReturnValue(connecting(answer));
  TestBed.configureTestingModule({
    providers: [
      { provide: SETTINGS_STORE, useValue: settings },
      { provide: WORKING_STATE_STORE, useValue: memoryStore(workingState) },
      { provide: ContentTabsService, useValue: {} },
      { provide: MenuService, useValue: { openList: () => undefined } },
      { provide: CAPABILITY_GRANTS, useValue: { 'team-docs': ['contributions'] } },
      ...provideFramePlugins({
        id: 'team-docs',
        name: 'Team docs',
        entryUrl: '/docs/plugin.html',
        capabilities: ['contributions'],
      }),
    ],
  });
  TestBed.inject(FramePluginRuntime).activateAll();
  return TestBed.inject(FailedPluginContent);
}

function eventually(assertion: () => void): Promise<void> {
  return vi.waitFor(
    () => {
      TestBed.tick();
      assertion();
    },
    { timeout: 5000, interval: 5 },
  );
}

async function connectedMethods() {
  await eventually(() => expect(connectMock).toHaveBeenCalled());
  return connectMock.mock.calls.at(-1)?.[0].methods as Record<
    string,
    (...args: unknown[]) => unknown
  >;
}

async function answeredOnce(workingState: Map<string, string>): Promise<void> {
  session(Promise.resolve({}), workingState);
  const methods = await connectedMethods();
  methods['registerSurface']({
    id: 'docs.page',
    title: 'Docs',
    routable: { path: 'docs/:id' },
    iframe: '/docs/page.html',
  });
  methods['registerSurface']({
    id: 'docs.outline',
    title: 'Outline',
    docks: ['primary'],
    iframe: '/docs/outline.html',
  });
  await eventually(() =>
    expect(workingState.get(FRAME_PLUGIN_ADDRESSES_KEY)).toContain(
      'view:docs.outline',
    ),
  );
}

async function failedAgain(workingState: Map<string, string>) {
  const lost = session(Promise.reject(new Error('offline')), workingState);
  await eventually(() => expect(lost.recoveryFor('docs/7')).toBeDefined());
  return lost;
}

describe('a frame plugin that could not be loaded', () => {
  let workingState: Map<string, string>;

  beforeEach(() => {
    vi.useRealTimers();
    workingState = new Map();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    for (const frame of document.querySelectorAll('iframe')) {
      frame.remove();
    }
  });

  it('is named at the addresses it answered before, and nowhere else', async () => {
    await answeredOnce(workingState);

    const lost = await failedAgain(workingState);

    expect(lost.recoveryFor('docs/7')?.name).toBe('Team docs');
    expect(lost.recoveryFor('view:docs.outline')?.name).toBe('Team docs');
    expect(lost.recoveryFor('elsewhere/7')).toBeUndefined();
  });

  it('is started again when the user tries again, and is no longer named once it answers', async () => {
    await answeredOnce(workingState);
    const lost = await failedAgain(workingState);
    connectMock.mockReturnValue(connecting(Promise.resolve({})));

    lost.recoveryFor('docs/7')?.retry();

    await eventually(() => expect(connectMock).toHaveBeenCalledTimes(2));
    await eventually(() => expect(lost.recoveryFor('docs/7')).toBeUndefined());
  });

  it('is not named for an address it never answered', async () => {
    const lost = session(Promise.reject(new Error('offline')), workingState);

    await eventually(() =>
      expect(console.error).toHaveBeenCalledWith(
        'Sandbox plugin "team-docs" failed to connect',
        expect.any(Error),
      ),
    );
    expect(lost.recoveryFor('docs/7')).toBeUndefined();
  });

  it('stays named while trying again has not been answered yet', async () => {
    await answeredOnce(workingState);
    const lost = await failedAgain(workingState);
    connectMock.mockReturnValue(connecting(new Promise(() => undefined)));

    lost.recoveryFor('docs/7')?.retry();

    await eventually(() => expect(connectMock).toHaveBeenCalledTimes(2));
    expect(lost.recoveryFor('docs/7')?.name).toBe('Team docs');
  });

  it('drops what it remembers of a plugin that is no longer composed or installed', async () => {
    workingState.set(
      FRAME_PLUGIN_ADDRESSES_KEY,
      JSON.stringify({ gone: ['old/place'], 'team-docs': ['docs/:id'] }),
    );

    session(Promise.reject(new Error('offline')), workingState);

    await eventually(() =>
      expect(rememberedPlugins(workingState)).toEqual(['team-docs']),
    );
  });

  it('keeps what it remembers of an installed plugin until the installed list has been read', async () => {
    workingState.set(
      FRAME_PLUGIN_ADDRESSES_KEY,
      JSON.stringify({ gone: ['old/place'], installed: ['mine'] }),
    );
    let readInstalled: (raw: string) => void = () => undefined;
    const settings: KeyValueStore = {
      get: (key) =>
        key === 'lw.shell.installed-plugins'
          ? new Promise<string>((resolve) => (readInstalled = resolve))
          : Promise.resolve(undefined),
      set: () => Promise.resolve(),
      delete: () => Promise.resolve(),
    };

    session(Promise.reject(new Error('offline')), workingState, settings);
    await eventually(() =>
      expect(console.error).toHaveBeenCalledWith(
        'Sandbox plugin "team-docs" failed to connect',
        expect.any(Error),
      ),
    );
    expect(rememberedPlugins(workingState)).toEqual(['gone', 'installed']);
    connectMock.mockReturnValue(connecting(new Promise(() => undefined)));

    readInstalled(
      JSON.stringify([
        { id: 'installed', name: 'Mine', entryUrl: '/installed/plugin.html' },
      ]),
    );

    await eventually(() =>
      expect(rememberedPlugins(workingState)).toEqual(['installed']),
    );
  });
});
