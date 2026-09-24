import {
  ApplicationRef,
  Component,
  WritableSignal,
  signal,
} from '@angular/core';
import { Location } from '@angular/common';
import { NavigationEnd, Router, Routes } from '@angular/router';
import { Subject } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { ANONYMOUS, AuthSnapshot } from '@loomweaver/plugin-sdk';
import { ContentRouter } from './content-router';
import { SurfaceRouteStub } from './surface-route-stub';
import { ContributionRegistry } from '../../../contributions/contribution-registry';
import { AUTH_SOURCE } from '../../../auth/auth-context';
import { keepPopout } from './keep-popout.guard';
import { settleWorkspace } from './settle-workspace.guard';
import type { Mock } from 'vitest';

@Component({ selector: 'lw-test-route', template: '' })
class TestRoute {}

function contentRoutesOf(
  routes: { path?: string }[],
): { path?: string; data?: unknown }[] {
  return routes.filter((route) => !route.path?.startsWith('popout'));
}

describe('ContentRouter', () => {
  let router: {
    resetConfig: Mock;
    initialNavigation: Mock;
    navigateByUrl: Mock;
    url: string;
    events: Subject<NavigationEnd>;
  };
  let registry: ContributionRegistry;
  let popState: () => void;

  function setup(path: string) {
    router = {
      resetConfig: vi.fn(),
      initialNavigation: vi.fn(),
      navigateByUrl: vi.fn().mockResolvedValue(true),
      url: '/',
      events: new Subject<NavigationEnd>(),
    };
    popState = () => undefined;
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        {
          provide: Location,
          useValue: {
            path: () => path,
            subscribe: (callback: () => void) => {
              popState = callback;
              return { unsubscribe: () => undefined };
            },
          },
        },
      ],
    });
    registry = TestBed.inject(ContributionRegistry);
    return TestBed.inject(ContentRouter);
  }

  function tick() {
    TestBed.inject(ApplicationRef).tick();
  }

  it('sets the config from the registered routes and starts the initial navigation', () => {
    const content = setup('/');
    registry.addContentRoute({ path: 'search', component: TestRoute });

    content.start();

    expect(router.resetConfig).toHaveBeenCalledTimes(1);
    expect(
      contentRoutesOf(router.resetConfig.mock.calls[0][0])[0],
    ).toMatchObject({
      path: 'search',
    });
    expect(router.initialNavigation).toHaveBeenCalledTimes(1);
  });

  it('is idempotent: a second start does nothing', () => {
    const content = setup('/');
    content.start();
    content.start();
    expect(router.initialNavigation).toHaveBeenCalledTimes(1);
  });

  it('rebuilds the config when routes change', async () => {
    const content = setup('/');
    content.start();
    router.resetConfig.mockClear();

    registry.addContentRoute({ path: 'reports', component: TestRoute });
    tick();

    expect(router.resetConfig).toHaveBeenCalledTimes(1);
  });

  it('resolves a captured deep-link once its route is registered', async () => {
    const content = setup('/doc/7');
    content.start();
    expect(router.navigateByUrl).not.toHaveBeenCalled();

    registry.addContentRoute({ path: 'doc/:id', component: TestRoute });
    tick();
    await Promise.resolve();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/doc/7', {
      onSameUrlNavigation: 'reload',
    });
  });

  it('does not chase a deep-link once the user has navigated away (popstate)', () => {
    const content = setup('/doc/7');
    content.start();
    popState();
    router.url = '/reports';

    registry.addContentRoute({ path: 'doc/:id', component: TestRoute });
    tick();

    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('resolves an address a workspace switch held once its content registers', async () => {
    const content = setup('/');
    registry.addContentRoute({ path: 'sales/customers', component: TestRoute });
    content.start();
    content.hold('finance/matching');
    router.url = '/sales/customers';

    registry.addContentRoute({
      path: 'finance/matching',
      component: TestRoute,
    });
    tick();
    await Promise.resolve();

    expect(router.navigateByUrl).toHaveBeenCalledWith('finance/matching', {
      onSameUrlNavigation: 'reload',
    });
  });

  it('lets a held address go once a navigation lands elsewhere, so the user is not pulled back', async () => {
    const content = setup('/');
    registry.addContentRoute({ path: 'people/payroll', component: TestRoute });
    registry.addContentRoute({
      path: 'people/employees',
      component: TestRoute,
    });
    content.start();
    content.hold('people/payroll');
    router.url = '/people/payroll';
    router.events.next(
      new NavigationEnd(1, '/people/payroll', '/people/payroll'),
    );
    router.url = '/people/employees';
    router.events.next(
      new NavigationEnd(2, '/people/employees', '/people/employees'),
    );

    registry.addContentRoute({ path: 'doc/:id', component: TestRoute });
    tick();
    await Promise.resolve();

    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('recovers a deep-link after the router drifts programmatically during boot (LWF-02a)', async () => {
    const content = setup('/doc/7');
    content.start();
    router.url = '/reports';

    registry.addContentRoute({ path: 'doc/:id', component: TestRoute });
    tick();
    await Promise.resolve();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/doc/7', {
      onSameUrlNavigation: 'reload',
    });
  });

  it('gives a pending deep-link something to land on, so the initial navigation matches', () => {
    const content = setup('/doc/7');
    registry.addContentRoute({ path: 'search', component: TestRoute });

    content.start();

    const config = router.resetConfig.mock.calls[0][0] as Routes;
    const placeholder = config.find((route) => route.path === 'doc/7');
    expect(placeholder).toBeDefined();
    expect(placeholder?.component).toBe(SurfaceRouteStub);
  });

  it('settles the workspace for a deep-link nothing answers, so its explanation is read where it belongs', () => {
    const content = setup('/finance/matching');
    registry.addContentRoute({
      path: 'finance/receivables',
      component: TestRoute,
    });

    content.start();

    const config = router.resetConfig.mock.calls[0][0] as Routes;
    const placeholder = config.find(
      (route) => route.path === 'finance/matching',
    );
    expect(placeholder?.component).toBe(SurfaceRouteStub);
    expect(placeholder?.canActivate).toEqual([keepPopout, settleWorkspace]);
  });

  it('still lands the deep-link where a home route would swallow it as a prefix', () => {
    const content = setup('/doc/7');
    registry.addContentRoute({ path: '', component: TestRoute });

    content.start();

    const config = router.resetConfig.mock.calls[0][0] as Routes;
    expect(config.some((route) => route.path === 'doc/7')).toBe(true);
  });

  it('leaves an address a real route already answers to that route', () => {
    const content = setup('/doc/7');
    registry.addContentRoute({ path: 'doc/:id', component: TestRoute });

    content.start();

    const config = router.resetConfig.mock.calls[0][0] as Routes;
    expect(config.some((route) => route.path === 'doc/7')).toBe(false);
  });

  it('drops the placeholder once the route that answers the address registers', async () => {
    const content = setup('/doc/7');
    content.start();

    registry.addContentRoute({ path: 'doc/:id', component: TestRoute });
    tick();
    await Promise.resolve();

    const config = router.resetConfig.mock.calls.at(-1)?.[0] as Routes;
    expect(config.some((route) => route.path === 'doc/7')).toBe(false);
    expect(config.some((route) => route.path === 'doc/:id')).toBe(true);
  });

  it('captures no deep-link for the home URL', () => {
    const content = setup('/');
    content.start();
    registry.addContentRoute({ path: 'doc/:id', component: TestRoute });
    tick();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});

describe('ContentRouter auth re-match', () => {
  function setup(url: string, auth: WritableSignal<AuthSnapshot>) {
    const router = {
      resetConfig: vi.fn(),
      initialNavigation: vi.fn(),
      navigateByUrl: vi.fn().mockResolvedValue(true),
      url,
      events: new Subject<NavigationEnd>(),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        {
          provide: Location,
          useValue: {
            path: () => url,
            subscribe: () => ({ unsubscribe: () => undefined }),
          },
        },
        { provide: AUTH_SOURCE, useValue: auth },
      ],
    });
    const registry = TestBed.inject(ContributionRegistry);
    return { router, registry, content: () => TestBed.inject(ContentRouter) };
  }

  function tick() {
    TestBed.inject(ApplicationRef).tick();
  }

  it('re-navigates (reload) on an auth change when the current route is gated', () => {
    const auth = signal<AuthSnapshot>(ANONYMOUS);
    const { router, registry, content } = setup('/secret', auth);
    registry.addContentRoute({
      path: 'secret',
      component: TestRoute,
      access: { anyRole: ['admin'] },
    });
    content().start();
    tick();
    router.navigateByUrl.mockClear();

    auth.set({ authenticated: true, roles: ['admin'], claims: {} });
    tick();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/secret', {
      onSameUrlNavigation: 'reload',
    });
  });

  it('does not re-navigate on an auth change when the current route is ungated', () => {
    const auth = signal<AuthSnapshot>(ANONYMOUS);
    const { router, registry, content } = setup('/search', auth);
    registry.addContentRoute({ path: 'search', component: TestRoute });
    content().start();
    tick();
    router.navigateByUrl.mockClear();

    auth.set({ authenticated: true, roles: ['admin'], claims: {} });
    tick();

    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
