import { TestBed } from '@angular/core/testing';
import { connect } from 'penpal';
import type { Mock } from 'vitest';
import { CAPABILITY_GRANTS } from '../../permissions/provide-capability-grants';
import { ContentTabsService } from '../../regions/content/tabs/content-tabs.service';
import { MenuService } from '../../menu/menu.service';
import { FailedPluginContent } from '../failed-plugin-content';
import { FramePluginRuntime, provideFramePlugins } from './frame-plugin-runtime';
import { FRAME_PLUGIN_ADDRESSES_KEY } from './frame-plugin-addresses';

vi.mock('penpal', () => ({
  connect: vi.fn(),
  WindowMessenger: vi.fn(),
}));

const connectMock = connect as Mock;

function connecting(promise: Promise<unknown>) {
  return { promise, destroy: vi.fn() };
}

function session(answer: Promise<unknown>) {
  TestBed.resetTestingModule();
  connectMock.mockReset().mockReturnValue(connecting(answer));
  TestBed.configureTestingModule({
    providers: [
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

async function settled(): Promise<void> {
  TestBed.tick();
  for (let turn = 0; turn < 4; turn += 1) {
    await Promise.resolve();
  }
}

function methods() {
  return connectMock.mock.calls.at(-1)?.[0].methods as Record<
    string,
    (...args: unknown[]) => unknown
  >;
}

async function answeredOnce(): Promise<void> {
  session(Promise.resolve({}));
  await settled();
  methods()['registerSurface']({
    id: 'docs.page',
    title: 'Docs',
    routable: { path: 'docs/:id' },
    iframe: '/docs/page.html',
  });
  methods()['registerSurface']({
    id: 'docs.outline',
    title: 'Outline',
    docks: ['primary'],
    iframe: '/docs/outline.html',
  });
  await settled();
}

describe('a frame plugin that could not be loaded', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    for (const frame of document.querySelectorAll('iframe')) {
      frame.remove();
    }
    localStorage.clear();
  });

  it('is named at the addresses it answered before, and nowhere else', async () => {
    await answeredOnce();

    const lost = session(Promise.reject(new Error('offline')));
    await settled();

    expect(lost.recoveryFor('docs/7')?.name).toBe('Team docs');
    expect(lost.recoveryFor('view:docs.outline')?.name).toBe('Team docs');
    expect(lost.recoveryFor('elsewhere/7')).toBeUndefined();
  });

  it('is started again when the user tries again, and is no longer named once it answers', async () => {
    await answeredOnce();
    const lost = session(Promise.reject(new Error('offline')));
    await settled();
    connectMock.mockReturnValue(connecting(Promise.resolve({})));

    lost.recoveryFor('docs/7')?.retry();
    await settled();

    expect(connectMock).toHaveBeenCalledTimes(2);
    expect(lost.recoveryFor('docs/7')).toBeUndefined();
  });

  it('is not named for an address it never answered', async () => {
    const lost = session(Promise.reject(new Error('offline')));
    await settled();

    expect(lost.recoveryFor('docs/7')).toBeUndefined();
  });

  it('stays named while trying again has not been answered yet', async () => {
    await answeredOnce();
    const lost = session(Promise.reject(new Error('offline')));
    await settled();
    connectMock.mockReturnValue(connecting(new Promise(() => undefined)));

    lost.recoveryFor('docs/7')?.retry();
    await settled();

    expect(lost.recoveryFor('docs/7')?.name).toBe('Team docs');
  });

  it('drops what it remembers of a plugin that is no longer composed or installed', async () => {
    localStorage.setItem(
      FRAME_PLUGIN_ADDRESSES_KEY,
      JSON.stringify({ gone: ['old/place'], 'team-docs': ['docs/:id'] }),
    );

    session(Promise.reject(new Error('offline')));
    await settled();

    expect(
      Object.keys(
        JSON.parse(localStorage.getItem(FRAME_PLUGIN_ADDRESSES_KEY) ?? '{}'),
      ),
    ).toEqual(['team-docs']);
  });
});

