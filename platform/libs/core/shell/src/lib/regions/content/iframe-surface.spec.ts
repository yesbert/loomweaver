import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { AuthSnapshot } from '@loomweaver/plugin-sdk';
import { IframeSurface } from './iframe-surface';
import { ContentTabsService } from './tabs/content-tabs.service';
import { AUTH_SOURCE } from '../../auth/auth-context';
import { CapabilityGrantService } from '../../permissions/capability-grant.service';
import { PluginIsolationLevelService } from '../../foundation/plugin-isolation-level';

interface NavigatesWithinTabRoot {
  navigateWithinTabRoot(path: string): void;
}

describe('IframeSurface', () => {
  function create(
    pluginId?: string,
    level?: 'isolated' | 'embedded',
    session?: AuthSnapshot,
  ) {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [
        provideRouter([]),
        ...(session ? [{ provide: AUTH_SOURCE, useValue: signal(session) }] : []),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { iframe: '/sandbox/view.html', urlDriven: true, pluginId },
              params: {},
              routeConfig: null,
              pathFromRoot: [{ url: [] }, { url: [{ path: 'sandbox' }] }],
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
