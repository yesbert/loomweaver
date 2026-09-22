import {
  Component,
  WritableSignal,
  inject,
  provideAppInitializer,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouteReuseStrategy,
  withDisabledInitialNavigation,
} from '@angular/router';
import { ANONYMOUS, AuthSnapshot, ContentRoute } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { AUTH_SOURCE } from '../../../auth/auth-context';
import { ContentRouter } from './content-router';
import { ContentReuseStrategy } from './content-reuse-strategy';

@Component({ selector: 'lw-test-content', template: '' })
class TestContent {}

const SIGNED_IN: AuthSnapshot = { authenticated: true, roles: [], claims: {} };

const DOCUMENT_WITH_TABS: ContentRoute = {
  path: 'doc/:id',
  component: TestContent,
  subRoutes: ['general', 'design'],
  access: { authenticated: true },
};

const ASSISTANT_CONTAINER = {
  path: 'assistants/:assistantId',
  container: {
    children: [
      { surface: 'assistant.general', segment: 'general' },
      { surface: 'assistant.design', segment: 'design' },
    ],
  },
  access: { authenticated: true },
} as ContentRoute;

async function openAt(
  address: string,
  route: ContentRoute,
  auth: WritableSignal<AuthSnapshot>,
): Promise<Router> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([], withDisabledInitialNavigation()),
      provideLocationMocks(),
      { provide: RouteReuseStrategy, useExisting: ContentReuseStrategy },
      { provide: AUTH_SOURCE, useValue: auth },
      provideAppInitializer(() => {
        inject(Location).go(address);
      }),
    ],
  });
  const router = TestBed.inject(Router);
  TestBed.inject(ContributionRegistry).addContentRoute(route);
  TestBed.inject(ContentRouter).start();
  TestBed.tick();
  await router.navigateByUrl(TestBed.inject(Location).path());
  return router;
}

function leaf(router: Router): ActivatedRouteSnapshot {
  let node = router.routerState.snapshot.root;
  while (node.firstChild) {
    node = node.firstChild;
  }
  return node;
}

function contentOf(router: Router): ActivatedRouteSnapshot | undefined {
  return leaf(router).parent ?? undefined;
}

async function signIn(auth: WritableSignal<AuthSnapshot>): Promise<void> {
  auth.set(SIGNED_IN);
  TestBed.tick();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('a gated address keeps its sub-address', () => {
  it('holds a sub-address while the session is not there, and opens it once it is', async () => {
    const auth = signal<AuthSnapshot>(ANONYMOUS);
    const router = await openAt('/doc/7/design', DOCUMENT_WITH_TABS, auth);

    expect(router.url).toBe('/doc/7/design');
    expect(contentOf(router)?.data['authPlaceholder']).toBe(true);

    await signIn(auth);

    expect(router.url).toBe('/doc/7/design');
    expect(contentOf(router)?.data['authPlaceholder']).toBeUndefined();
    expect(leaf(router).routeConfig?.path).toBe('design');
  });

  it("holds a container child's address and opens the container on it", async () => {
    const auth = signal<AuthSnapshot>(ANONYMOUS);
    const router = await openAt(
      '/assistants/5/design',
      ASSISTANT_CONTAINER,
      auth,
    );

    expect(router.url).toBe('/assistants/5/design');
    expect(contentOf(router)?.data['authPlaceholder']).toBe(true);

    await signIn(auth);

    expect(router.url).toBe('/assistants/5/design');
    expect(contentOf(router)?.data['container']).toBeDefined();
    expect(leaf(router).routeConfig?.path).toBe('design');
  });

  it('opens a sub-address directly when the session is already there', async () => {
    const auth = signal<AuthSnapshot>(SIGNED_IN);
    const router = await openAt('/doc/7/general', DOCUMENT_WITH_TABS, auth);

    expect(router.url).toBe('/doc/7/general');
    expect(contentOf(router)?.data['authPlaceholder']).toBeUndefined();
  });
});
