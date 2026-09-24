import {
  ApplicationRef,
  Component,
  EnvironmentProviders,
  Provider,
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
import { provideLayout, ShellLayout } from '../../../layout/layout';
import { provideWorkspaces } from '../../../workspace/provide-workspaces';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';
import { findLeaf } from '../../pane/tree/pane-queries';
import { CONTENT_DOCK } from '../../pane/tree/pane-address';
import { ContentTabsService } from '../tabs/content-tabs.service';
import { AddressBody } from '../address-body';
import { WorkspaceService } from '../../../workspace/workspace.service';
import { WORKSPACE_CLAIMS } from '../../../foundation/workspace-claims';

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

const KNOWLEDGE_BASE: readonly ContentRoute[] = [
  'knowledge-base',
  'knowledge-base/:entryId',
  'knowledge-base/tags',
  'knowledge-base/categories',
].map((path) => ({
  path,
  component: TestContent,
  access: { authenticated: true },
}));

const CLAIMING_WORKSPACE = provideWorkspaces({
  id: 'knowledge-base',
  title: 'Knowledge base',
  claims: ['knowledge-base'],
  content: { tabs: [{ path: 'knowledge-base', closable: false }] },
});

const LAYOUT: ShellLayout = {
  regions: [{ id: 'main', type: 'content', dock: 'center' }],
};

async function openAt(
  address: string,
  route: ContentRoute | readonly ContentRoute[],
  auth: WritableSignal<AuthSnapshot>,
  providers: readonly (Provider | EnvironmentProviders)[] = [],
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
      ...providers,
    ],
  });
  const router = TestBed.inject(Router);
  for (const each of Array.isArray(route) ? route : [route]) {
    TestBed.inject(ContributionRegistry).addContentRoute(each);
  }
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

function heldBack(router: Router): boolean {
  return contentOf(router)?.routeConfig?.canMatch === undefined;
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
    expect(heldBack(router)).toBe(true);

    await signIn(auth);

    expect(router.url).toBe('/doc/7/design');
    expect(heldBack(router)).toBe(false);
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
    expect(heldBack(router)).toBe(true);

    await signIn(auth);

    expect(router.url).toBe('/assistants/5/design');
    expect(heldBack(router)).toBe(false);
    expect(leaf(router).routeConfig?.path).toBe('design');
  });

  it('opens a sub-address directly when the session is already there', async () => {
    const auth = signal<AuthSnapshot>(SIGNED_IN);
    const router = await openAt('/doc/7/general', DOCUMENT_WITH_TABS, auth);

    expect(router.url).toBe('/doc/7/general');
    expect(heldBack(router)).toBe(false);
  });

  describe('inside the workspace that claims it', () => {
    beforeEach(() => localStorage.clear());

    async function drawnAfterSignIn(address: string): Promise<{
      readonly tabs: readonly string[];
      readonly drawn: string;
      readonly url: string;
    }> {
      const auth = signal<AuthSnapshot>(ANONYMOUS);
      const router = await openAt(address, KNOWLEDGE_BASE, auth, [
        provideLayout(LAYOUT),
        CLAIMING_WORKSPACE,
        { provide: WORKSPACE_CLAIMS, useExisting: WorkspaceService },
      ]);
      TestBed.inject(ContentTabsService);
      const body = TestBed.inject(AddressBody);
      const paneTree = TestBed.inject(PaneTreeService);
      await signIn(auth);
      await TestBed.inject(ApplicationRef).whenStable();
      const leaf = findLeaf(
        paneTree.tree(CONTENT_DOCK),
        paneTree.primaryId(CONTENT_DOCK),
      );
      return {
        tabs: leaf?.tabs.map((tab) => tab.path) ?? [],
        drawn: leaf ? body.pathFor(leaf) : '',
        url: router.url,
      };
    }

    it('opens a named sub-address, not the listing the workspace declares', async () => {
      const opened = await drawnAfterSignIn('/knowledge-base/tags');

      expect(opened.url).toBe('/knowledge-base/tags');
      expect(opened.tabs).toContain('knowledge-base/tags');
      expect(opened.drawn).toBe('knowledge-base/tags');
    });

    it('opens an entry at its own address, not the listing', async () => {
      const opened = await drawnAfterSignIn('/knowledge-base/e-17');

      expect(opened.url).toBe('/knowledge-base/e-17');
      expect(opened.tabs).toContain('knowledge-base/e-17');
      expect(opened.drawn).toBe('knowledge-base/e-17');
    });
  });
});
