import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, RouterOutlet, provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ANONYMOUS, AuthSnapshot, ContentRoute } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { AUTH_SOURCE, AuthContext } from '../../auth/auth-context';
import {
  PaddingDefault,
  SURFACE_PADDING,
} from '../../foundation/surface-padding';
import { ContentSecondaryPane } from './content-secondary-pane';
import { offRouterPaneTargets, routerPaneTargets } from './pane-targets';
import { syntheticRouteFor } from './routing/synthetic-route';

@Component({
  selector: 'lw-test-param-view',
  imports: [RouterOutlet],
  template: `<span data-testid="param">{{ id }}</span
    ><router-outlet />`,
})
class ParamView {
  protected readonly id =
    inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
}

const DOC_ROUTE: ContentRoute = {
  path: 'doc/:id',
  component: ParamView,
  subRoutes: ['code', 'preview'],
};

describe('syntheticRouteFor (every pane renders its content)', () => {
  it('resolves route params from the stored pane path against the pattern', () => {
    const route = syntheticRouteFor(DOC_ROUTE, 'doc/main/code');
    expect(route.snapshot.paramMap.get('id')).toBe('main');
    expect(route.snapshot.url.map((s) => s.path)).toEqual(['doc', 'main']);
    expect(
      route.snapshot.pathFromRoot.flatMap((r) => r.url.map((s) => s.path)),
    ).toEqual(['doc', 'main']);
  });

  it('carries the iframe URL as route data for sandbox surfaces', () => {
    const iframeRoute = {
      path: 'sandbox-rpc',
      iframe: '/sandbox-rpc/view.html',
    } as ContentRoute;
    const route = syntheticRouteFor(iframeRoute, 'sandbox-rpc');
    expect(route.snapshot.data['iframe']).toBe('/sandbox-rpc/view.html');
  });
});

describe('pane targets — both pickers gate on the session', () => {
  const GATED: ContentRoute = {
    path: 'secret',
    component: ParamView,
    access: { anyRole: ['admin'] },
  };
  const PUBLIC: ContentRoute = { path: 'search', component: ParamView };

  function setup(session: AuthSnapshot): {
    registry: ContributionRegistry;
    auth: AuthContext;
  } {
    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_SOURCE, useValue: signal(session) }],
    });
    const registry = TestBed.inject(ContributionRegistry);
    registry.addContentRoute(PUBLIC);
    registry.addContentRoute(GATED);
    return { registry, auth: TestBed.inject(AuthContext) };
  }

  it('offers a gated route to the router picker once the session qualifies', () => {
    const { registry, auth } = setup({
      authenticated: true,
      roles: ['admin'],
      claims: {},
    });

    expect(routerPaneTargets(registry, auth).map((t) => t.path)).toEqual([
      'search',
      'secret',
    ]);
  });

  it('withholds a gated route from the router picker while the session does not qualify', () => {
    const { registry, auth } = setup(ANONYMOUS);

    expect(routerPaneTargets(registry, auth).map((t) => t.path)).toEqual([
      'search',
    ]);
  });

  it('offers a gated route to the off-router picker once the session qualifies — the mount re-checks reactively (finding #32)', () => {
    const { registry, auth } = setup({
      authenticated: true,
      roles: ['admin'],
      claims: {},
    });

    expect(offRouterPaneTargets(registry, auth).map((t) => t.path)).toEqual([
      'search',
      'secret',
    ]);
  });

  it('withholds a gated route from the off-router picker while the session does not qualify', () => {
    const { registry, auth } = setup(ANONYMOUS);

    expect(offRouterPaneTargets(registry, auth).map((t) => t.path)).toEqual([
      'search',
    ]);
  });

  it('ignores mode:disable on a route — a route is reachable or not (the published contract)', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_SOURCE, useValue: signal(ANONYMOUS) }],
    });
    const registry = TestBed.inject(ContributionRegistry);
    registry.addContentRoute({
      path: 'lax',
      component: ParamView,
      access: { authenticated: true, mode: 'disable' },
    });

    expect(
      routerPaneTargets(registry, TestBed.inject(AuthContext)).map(
        (t) => t.path,
      ),
    ).toEqual([]);
  });
});

describe('ContentSecondaryPane mounting honours access (mode is ignored for routes/views)', () => {
  it('does not host-mount a route whose requirement is unmet, even with mode:disable', async () => {
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
        { provide: AUTH_SOURCE, useValue: signal(ANONYMOUS) },
      ],
    });
    TestBed.inject(ContributionRegistry).addContentRoute({
      path: 'lax',
      component: ParamView,
      access: { authenticated: true, mode: 'disable' },
    });

    const fixture = TestBed.createComponent(ContentSecondaryPane);
    fixture.componentRef.setInput('path', 'lax');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="param"]',
      ),
    ).toBeNull();
  });
});

describe('A host-mounted pane says why it is empty', () => {
  function mount(
    session: AuthSnapshot,
    path: string,
    seed: (registry: ContributionRegistry) => void,
  ): HTMLElement {
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
        { provide: AUTH_SOURCE, useValue: signal(session) },
      ],
    });
    seed(TestBed.inject(ContributionRegistry));

    const fixture = TestBed.createComponent(ContentSecondaryPane);
    fixture.componentRef.setInput('path', path);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  const GATED: ContentRoute = {
    path: 'secret',
    component: ParamView,
    access: { anyRole: ['admin'] },
  };

  it('shows the access placeholder for a gated route, asking a signed-out visitor to sign in', () => {
    const element = mount(ANONYMOUS, 'secret', (registry) =>
      registry.addContentRoute(GATED),
    );

    expect(
      element.querySelector('[data-testid="access-placeholder"]'),
    ).not.toBeNull();
    expect(element.textContent).toContain('auth.requiredTitle');
  });

  it('tells a signed-in principal without the role that their account has no access', () => {
    const element = mount(
      { authenticated: true, roles: ['user'], claims: {} },
      'secret',
      (registry) => registry.addContentRoute(GATED),
    );

    expect(element.textContent).toContain('auth.deniedTitle');
    expect(element.textContent).not.toContain('auth.requiredTitle');
  });

  it('shows the access placeholder for a gated container child, which is seeded whatever the session', () => {
    const element = mount(ANONYMOUS, 'view:runs.audit', (registry) =>
      registry.addView({
        id: 'runs.audit',
        title: 'runs.audit',
        region: 'primary',
        component: ParamView,
        access: { anyRole: ['admin'] },
      }),
    );

    expect(
      element.querySelector('[data-testid="access-placeholder"]'),
    ).not.toBeNull();
  });

  it('says "view not available" for a path nothing registers, rather than rendering home under it', () => {
    const element = mount(ANONYMOUS, 'gone/away', (registry) =>
      registry.addContentRoute({ path: '', component: ParamView }),
    );

    expect(element.textContent).toContain('route.unavailableTitle');
    expect(element.querySelector('[data-testid="param"]')).toBeNull();
  });

  it('keeps the split text where it is true — the surface exists and simply cannot be mounted here', () => {
    const element = mount(ANONYMOUS, 'headless', (registry) =>
      registry.addContentRoute({ path: 'headless' } as ContentRoute),
    );

    expect(element.textContent).toContain('content.split.unavailable');
  });
});

describe('ContentSecondaryPane (host-mounts ANY content route)', () => {
  it('renders a param route component off-router with its resolved params + nested outlet stub', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    TestBed.inject(ContributionRegistry).addContentRoute(DOC_ROUTE);

    const fixture = TestBed.createComponent(ContentSecondaryPane);
    fixture.componentRef.setInput('path', 'doc/main/code');
    fixture.detectChanges();
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('[data-testid="param"]')?.textContent).toBe('main');
  });

  it('remounts with the real route once it registers after the pane (async sandbox registration)', async () => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [provideRouter([])],
    });
    const registry = TestBed.inject(ContributionRegistry);
    registry.addContentRoute({ path: '', component: ParamView });

    const fixture = TestBed.createComponent(ContentSecondaryPane);
    fixture.componentRef.setInput('path', 'sandbox-rpc/overview');
    fixture.detectChanges();
    await fixture.whenStable();

    registry.addContentRoute({
      path: 'sandbox-rpc',
      iframe: '/sandbox-rpc/view.html',
    } as ContentRoute);
    fixture.detectChanges();
    await fixture.whenStable();

    const iframe = (fixture.nativeElement as HTMLElement).querySelector(
      'iframe',
    );
    expect(iframe?.getAttribute('src')).toBe('/sandbox-rpc/view.html');
  });
});

describe('ContentSecondaryPane — the inset holds wherever the surface is put', () => {
  const CONTENT_INSET = 'p-6';
  const PANEL_INSET = 'p-3';

  async function paneFor(
    padding: PaddingDefault | undefined,
    declared: boolean | undefined,
    variant: 'content' | 'panel' = 'content',
  ): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        ...(padding === undefined
          ? []
          : [{ provide: SURFACE_PADDING, useValue: padding }]),
      ],
    });
    TestBed.inject(ContributionRegistry).addContentRoute({
      path: 'doc',
      component: ParamView,
      ...(declared !== undefined && { padded: declared }),
    } as ContentRoute);

    const fixture = TestBed.createComponent(ContentSecondaryPane);
    fixture.componentRef.setInput('path', 'doc');
    fixture.componentRef.setInput('variant', variant);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('leaves a surface flush where neither it nor the product asks for an inset', async () => {
    expect((await paneFor(undefined, undefined)).classList).not.toContain(
      CONTENT_INSET,
    );
  });

  it('insets a surface where the product asks for it and the surface says nothing', async () => {
    expect((await paneFor('inset', undefined)).classList).toContain(
      CONTENT_INSET,
    );
  });

  it('insets a surface that asks for it although the product asks for none', async () => {
    expect((await paneFor('none', true)).classList).toContain(CONTENT_INSET);
  });

  it('leaves flush a surface that asks for it although the product insets', async () => {
    expect((await paneFor('inset', false)).classList).not.toContain(
      CONTENT_INSET,
    );
  });

  it('carries a surface asking for an inset into a sidebar, where the inset is the panel one', async () => {
    expect((await paneFor('none', true, 'panel')).classList).toContain(
      PANEL_INSET,
    );
  });

  it('carries a surface asking to be flush into a sidebar too', async () => {
    expect((await paneFor('inset', false, 'panel')).classList).not.toContain(
      PANEL_INSET,
    );
  });
});
