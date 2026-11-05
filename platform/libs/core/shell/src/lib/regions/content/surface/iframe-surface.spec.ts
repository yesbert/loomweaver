import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { AuthSnapshot } from '@loomweaver/plugin-sdk';
import { IframeSurface } from './iframe-surface';
import { confinedTarget } from './iframe-surface-protocol';
import { ContributionRegistry } from '../../../contributions/contribution-registry';
import { ContentTabsService } from '../tabs/content-tabs.service';
import { AUTH_SOURCE } from '../../../auth/auth-context';
import { CapabilityGrantService } from '../../../permissions/capability-grant.service';
import { PluginIsolationLevelService } from '../../../plugin-isolation/plugin-isolation-level.service';

interface NavigatesWithinTabRoot {
  navigateWithinTabRoot(path: string): void;
}

interface ToldItsAddress {
  reactiveState(): { tab: string; rest?: string };
}

interface PushesToItsFrame {
  remote: unknown;
  pushSlot(subscription: string, view: unknown): void;
  pushState(key: string, value: unknown, loaded: boolean): void;
}

@Component({ selector: 'lw-test-page', template: '' })
class TestPage {}

describe('IframeSurface', () => {
  function create(
    pluginId?: string,
    level?: 'isolated' | 'embedded',
    session?: AuthSnapshot,
    shownAt: { segments?: string[]; rest?: boolean } = {},
  ) {
    const data = {
      iframe: '/sandbox/view.html',
      urlDriven: true,
      pluginId,
      ...(shownAt.rest && { rest: true }),
    };
    const url = (shownAt.segments ?? ['sandbox']).map((path) => ({ path }));
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [
        provideRouter([{ path: '**', component: TestPage }]),
        ...(session ? [{ provide: AUTH_SOURCE, useValue: signal(session) }] : []),
        {
          provide: ActivatedRoute,
          useValue: {
            data: of(data),
            snapshot: {
              data,
              params: {},
              routeConfig: null,
              pathFromRoot: [{ url: [] }, { url }],
            },
          },
        },
      ],
    });
    const tabs = TestBed.inject(ContentTabsService);
    if (pluginId && level) {
      TestBed.inject(PluginIsolationLevelService).register(pluginId, level);
    }
    if (pluginId && session) {
      TestBed.inject(CapabilityGrantService).register(
        pluginId,
        ['session'],
        ['session'],
      );
    }
    const fixture = TestBed.createComponent(IframeSurface);
    const surface =
      fixture.componentInstance as unknown as NavigatesWithinTabRoot;
    const isolated = (fixture.componentInstance as unknown as { isolated: boolean })
      .isolated;
    return { surface, tabs, isolated, component: fixture.componentInstance };
  }

  afterEach(() => localStorage.clear());

  it('reports itself as shown until the workbench stops showing it', () => {
    const callbacks: ((entries: { isIntersecting: boolean }[]) => void)[] = [];
    const original = globalThis.IntersectionObserver;
    globalThis.IntersectionObserver = class {
      constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
        callbacks.push(callback);
      }
      observe() {
        return;
      }
      disconnect() {
        return;
      }
    } as unknown as typeof IntersectionObserver;

    const { surface } = create();
    const inner = surface as unknown as {
      watchVisibility(): void;
      reactiveState(): { shown: boolean };
    };
    inner.watchVisibility();

    expect(inner.reactiveState().shown).toBe(true);

    callbacks[0]?.([{ isIntersecting: false }]);
    expect(inner.reactiveState().shown).toBe(false);

    callbacks[0]?.([{ isIntersecting: true }]);
    expect(inner.reactiveState().shown).toBe(true);

    globalThis.IntersectionObserver = original;
  });

  it('a surface whose plugin stated no level is isolated', () => {
    expect(create().isolated).toBe(true);
  });

  it('a surface whose plugin is isolated says so', () => {
    expect(create('p1', 'isolated').isolated).toBe(true);
  });

  it('an embedded surface is not', () => {
    expect(create('p1', 'embedded').isolated).toBe(false);
  });

  it('routes surface navigation through the fire-and-forget navigation owner', () => {
    const { surface, tabs } = create();
    const navigateTo = vi
      .spyOn(tabs, 'navigateTo')
      .mockImplementation(() => undefined);

    surface.navigateWithinTabRoot('sandbox/architecture');

    expect(navigateTo).toHaveBeenCalledWith('sandbox/architecture');
  });

  it('keeps the query string when the surface sets its own rest', () => {
    const { surface, tabs } = create();
    const navigateTo = vi
      .spyOn(tabs, 'navigateTo')
      .mockImplementation(() => undefined);

    surface.navigateWithinTabRoot('sandbox/pricing?treaty=886320');

    expect(navigateTo).toHaveBeenCalledWith('sandbox/pricing?treaty=886320');
  });

  it('rejects a rest that leaves the tab root, query string or not', () => {
    const { surface } = create();

    expect(() =>
      surface.navigateWithinTabRoot('elsewhere?treaty=886320'),
    ).toThrow(/confined to its own tab root/);
  });

  it('refuses a target that steps out of its tab root through a dot segment or a backslash', () => {
    const { surface, tabs } = create();
    const navigateTo = vi
      .spyOn(tabs, 'navigateTo')
      .mockImplementation(() => undefined);
    const stepsOut = [
      'sandbox/../admin',
      'sandbox/./../admin',
      'sandbox/%2e%2e/admin',
      'sandbox/%2E%2E/admin',
      'sandbox/.%2E/admin',
      'sandbox/%2e/admin',
      'sandbox/..',
      String.raw`sandbox\..\admin`,
      String.raw`sandbox/a\b`,
      'sandbox/a%5Cb',
      'sandbox/%2e%2e/admin;year=2026',
      String.raw`sandbox\..\admin;year=2026`,
    ];

    for (const path of stepsOut) {
      expect(() => surface.navigateWithinTabRoot(path)).toThrow(
        /confined to its own tab root/,
      );
    }
    expect(navigateTo).not.toHaveBeenCalled();
  });

  it('still takes a target whose segment merely contains dots', () => {
    expect(confinedTarget('sandbox', 'sandbox/v1.2/..hidden')).toBe(
      'sandbox/v1.2/..hidden',
    );
  });

  it('keeps its own address while it is kept but no longer shown, and is told nothing of the content that took over', async () => {
    const { component } = create(undefined, undefined, undefined, {
      rest: true,
    });
    TestBed.inject(ContributionRegistry).addContentRoute({
      path: 'sandbox',
      iframe: '/sandbox/view.html',
      rest: true,
    });
    const router = TestBed.inject(Router);
    const told = () => (component as unknown as ToldItsAddress).reactiveState();

    await router.navigateByUrl('/sandbox/pricing?treaty=886320');
    expect(told()).toMatchObject({
      tab: 'pricing',
      rest: 'pricing?treaty=886320',
    });

    await router.navigateByUrl('/elsewhere/42?token=secret#part');
    expect(told()).toMatchObject({
      tab: 'pricing',
      rest: 'pricing?treaty=886320',
    });

    await router.navigateByUrl('/sandbox/terms');
    expect(told()).toMatchObject({ tab: 'terms', rest: 'terms' });
  });

  it('follows the address below a tab root the address encodes', async () => {
    const { component, surface, tabs } = create(
      undefined,
      undefined,
      undefined,
      { segments: ['people', 'Müller'], rest: true },
    );
    TestBed.inject(ContributionRegistry).addContentRoute({
      path: 'people/:name',
      iframe: '/sandbox/view.html',
      rest: true,
    });
    const navigateTo = vi
      .spyOn(tabs, 'navigateTo')
      .mockImplementation(() => undefined);

    await TestBed.inject(Router).navigateByUrl('/people/M%C3%BCller/notes');

    expect(
      (component as unknown as ToldItsAddress).reactiveState(),
    ).toMatchObject({ tab: 'notes', rest: 'notes' });

    surface.navigateWithinTabRoot('people/Müller/files');

    expect(navigateTo).toHaveBeenCalledWith('people/M%C3%BCller/files');
  });

  it('leaves no rejection unhandled when a slot or state push is cut off', async () => {
    const { component } = create();
    const frame = component as unknown as PushesToItsFrame;
    const slotPush = Promise.reject(new Error('cut off'));
    const statePush = Promise.reject(new Error('cut off'));
    const slotCaught = vi.spyOn(slotPush, 'catch');
    const stateCaught = vi.spyOn(statePush, 'catch');
    frame.remote = {
      slotChanged: () => slotPush,
      stateChanged: () => statePush,
    };

    frame.pushSlot('s1', { items: [] });
    frame.pushState('k', 1, true);

    expect(slotCaught).toHaveBeenCalledTimes(1);
    expect(stateCaught).toHaveBeenCalledTimes(1);
    await Promise.allSettled([slotPush, statePush]);
  });

  it('tells a permitted surface who is signed in, and nothing it could sign in with', () => {
    const { component } = create('payments', 'isolated', {
      authenticated: true,
      roles: ['accounting'],
      claims: { access_token: 'ey.a.token', tenant: 'nordwind' },
      subject: 'user-4711',
      displayName: 'Nora Weber',
    });

    const state = (
      component as unknown as {
        reactiveState(): { session?: Record<string, unknown> };
      }
    ).reactiveState();

    expect(state.session).toEqual({
      authenticated: true,
      roles: ['accounting'],
    });
  });

  it('rejects surface navigation outside its own tab root', () => {
    const { surface, tabs } = create();
    const navigateTo = vi
      .spyOn(tabs, 'navigateTo')
      .mockImplementation(() => undefined);

    expect(() => surface.navigateWithinTabRoot('elsewhere')).toThrow(
      /confined to its own tab root/,
    );
    expect(navigateTo).not.toHaveBeenCalled();
  });
});
