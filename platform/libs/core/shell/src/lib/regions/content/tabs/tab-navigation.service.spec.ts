import {
  ApplicationRef,
  Component,
  EnvironmentProviders,
  Provider,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { WORKING_STATE_STORE } from '../../../persistence/working-state-store';
import { CONTENT_DOCK, PRIMARY_PANE } from '../../pane/tree/pane-address';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';
import { collectTabs } from '../../pane/tree/pane-queries';
import { buildContentRoutes } from '../routing/content-router';
import { BootAddress } from '../routing/boot-address';
import { ContentTabsService } from './content-tabs.service';

@Component({ selector: 'lw-test-content', template: '' })
class TestContent {}

const ROUTES: readonly ContentRoute[] = [
  { path: '', component: TestContent },
  { path: 'doc/:id', component: TestContent, id: 'testbed.doc' },
  { path: 'reports', component: TestContent, title: 'k.reports' },
  { path: 'note/:id', component: TestContent, subRoutes: ['preview'] },
];

async function setUp(providers: (Provider | EnvironmentProviders)[] = []) {
  localStorage.clear();
  TestBed.configureTestingModule({
    providers: [provideRouter(buildContentRoutes(ROUTES)), ...providers],
  });
  const registry = TestBed.inject(ContributionRegistry);
  for (const route of ROUTES) registry.addContentRoute(route);
  const service = TestBed.inject(ContentTabsService);
  const harness = await RouterTestingHarness.create();
  return { service, harness, registry };
}

describe('Navigating to a content tab', () => {
  let service: ContentTabsService;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    ({ service, harness } = await setUp());
  });

  it('navigating to a tab another pane holds focuses that pane instead of duplicating it', async () => {
    await harness.navigateByUrl('/doc/a');
    const paneTree = TestBed.inject(PaneTreeService);
    paneTree.splitPane('content', PRIMARY_PANE, 'row', 'doc/b');
    const holder = paneTree.sourceOf('doc/b')?.paneId;
    expect(holder).not.toBe(paneTree.primaryId(CONTENT_DOCK));

    await service.navigate('doc/b');

    expect(paneTree.primaryId(CONTENT_DOCK)).toBe(holder);
    expect(paneTree.sourceOf('doc/b')?.paneId).toBe(holder);
    expect(
      paneTree.primaryTabs(CONTENT_DOCK).filter((tab) => tab.path === 'doc/b'),
    ).toHaveLength(1);
    expect(paneTree.sourceOf('doc/a')?.paneId).not.toBe(
      paneTree.primaryId(CONTENT_DOCK),
    );
    expect(service.tabs().filter((tab) => tab.path === 'doc/b')).toHaveLength(
      1,
    );
  });

  it('a sub-route lands on the tab that owns it rather than opening a second copy', async () => {
    await harness.navigateByUrl('/reports');
    const paneTree = TestBed.inject(PaneTreeService);
    paneTree.splitPane('content', PRIMARY_PANE, 'row', 'note/b');

    await service.navigate('note/b/preview');

    expect(paneTree.sourceOf('note/b')?.paneId).toBe(
      paneTree.primaryId(CONTENT_DOCK),
    );
    expect(
      paneTree
        .primaryTabs(CONTENT_DOCK)
        .filter((tab) => tab.path.startsWith('note/b')),
    ).toHaveLength(1);
  });

  it('navigating home never claims a pane, because home is not a tab', async () => {
    await harness.navigateByUrl('/doc/a');
    const paneTree = TestBed.inject(PaneTreeService);
    paneTree.splitPane('content', PRIMARY_PANE, 'row', 'view:outline');
    const before = paneTree.sourceOf('view:outline')?.paneId;

    await service.navigate('');

    expect(paneTree.sourceOf('view:outline')?.paneId).toBe(before);
  });

  it('revealContentTab reaches a tab held by another pane and hands it the address', async () => {
    await harness.navigateByUrl('/doc/a');
    const paneTree = TestBed.inject(PaneTreeService);
    paneTree.splitPane('content', PRIMARY_PANE, 'row', 'doc/b');

    service.revealContentTab('doc/b');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(paneTree.sourceOf('doc/b')?.paneId).toBe(
      paneTree.primaryId(CONTENT_DOCK),
    );
    expect(TestBed.inject(Router).url).toBe('/doc/b');
  });

  it('revealContentTab navigates the URL for a tab in the primary pane', async () => {
    await harness.navigateByUrl('/');
    service.open({ path: 'doc/a', title: 'A.ts' });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');
    navigate.mockClear();

    service.revealContentTab('doc/a');

    expect(navigate).toHaveBeenCalledWith('/doc/a', { replaceUrl: false });
  });

  it('navigating to a tab the URL pane already holds leaves the layout alone', async () => {
    await harness.navigateByUrl('/doc/a');
    const paneTree = TestBed.inject(PaneTreeService);
    paneTree.splitPane('content', PRIMARY_PANE, 'row', 'doc/a');
    TestBed.inject(ApplicationRef).tick();
    const before = paneTree.serialize();

    await service.navigate('doc/a');
    TestBed.inject(ApplicationRef).tick();

    expect(paneTree.serialize()).toBe(before);
  });

  it('an ordinary navigation reaches the copy another pane already holds', async () => {
    await harness.navigateByUrl('/doc/a');
    const paneTree = TestBed.inject(PaneTreeService);
    paneTree.splitPane('content', PRIMARY_PANE, 'row', 'doc/b');
    TestBed.inject(ApplicationRef).tick();

    await TestBed.inject(Router).navigateByUrl('/doc/b');
    TestBed.inject(ApplicationRef).tick();

    expect(paneTree.primaryTabs('content').map((tab) => tab.path)).toEqual([
      'doc/b',
    ]);
    expect(
      collectTabs(paneTree.tree('content')).filter(
        (tab) => tab.path === 'doc/b',
      ),
    ).toHaveLength(1);
    expect(
      collectTabs(paneTree.tree('content')).some((tab) => tab.path === 'doc/a'),
    ).toBe(true);
  });

  it("a link and the workbench's own call both reach the pane that holds it", async () => {
    await harness.navigateByUrl('/doc/a');
    const paneTree = TestBed.inject(PaneTreeService);
    paneTree.splitPane('content', PRIMARY_PANE, 'row', 'doc/b');
    TestBed.inject(ApplicationRef).tick();

    await TestBed.inject(Router).navigateByUrl('/doc/b');
    TestBed.inject(ApplicationRef).tick();
    expect(paneTree.primaryTabs('content').map((tab) => tab.path)).toEqual([
      'doc/b',
    ]);

    await service.navigate('doc/a');
    TestBed.inject(ApplicationRef).tick();
    expect(paneTree.primaryTabs('content').map((tab) => tab.path)).toEqual([
      'doc/a',
    ]);
  });

  it('an ordinary navigation to nothing open lands where the address already is', async () => {
    await harness.navigateByUrl('/doc/a');
    const paneTree = TestBed.inject(PaneTreeService);
    paneTree.splitPane('content', PRIMARY_PANE, 'row', 'doc/b');
    TestBed.inject(ApplicationRef).tick();

    await TestBed.inject(Router).navigateByUrl('/reports');
    TestBed.inject(ApplicationRef).tick();

    expect(paneTree.primaryId('content')).toBe(PRIMARY_PANE);
    expect(paneTree.primaryTabs('content').map((tab) => tab.path)).toEqual([
      'doc/a',
      'reports',
    ]);
  });
});

describe('Following the address while the arrangement hydrates', () => {
  it('keeps the auto-opened deep-link tab after the pane tree hydrates', async () => {
    let resolve!: (raw: string | undefined) => void;
    const set = vi.fn(() => Promise.resolve());
    const { service, harness } = await setUp([
      {
        provide: WORKING_STATE_STORE,
        useValue: {
          get: (key: string) =>
            key === 'lw.shell.active-workspace'
              ? Promise.resolve(undefined)
              : new Promise<string | undefined>((r) => (resolve = r)),
          set,
        },
      },
    ]);

    await harness.navigateByUrl('/doc/abc');
    expect(service.tabs().some((tab) => tab.path === 'doc/abc')).toBe(true);
    expect(set).not.toHaveBeenCalled();

    resolve(
      JSON.stringify({ content: { kind: 'leaf', id: PRIMARY_PANE, tabs: [] } }),
    );
    await Promise.resolve();
    TestBed.inject(ApplicationRef).tick();

    expect(service.tabs().some((tab) => tab.path === 'doc/abc')).toBe(true);
  });
});

function documentAt(pathname: string): Document {
  return new Proxy(document, {
    get: (target, prop) =>
      prop === 'location'
        ? { pathname }
        : (Reflect.get(target, prop, target) as unknown),
  });
}

describe('Navigating in a pop-out window', () => {
  async function setUpAt(pathname: string) {
    TestBed.resetTestingModule();
    return setUp([
      { provide: DOCUMENT, useValue: documentAt(pathname) },
      { provide: BootAddress, useValue: { path: pathname } },
    ]);
  }

  it('refuses to navigate, so the window cannot stop being a pop-out', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { service } = await setUpAt('/popout/reports');

    const moved = await service.navigate('reports');

    expect(moved).toBe(false);
    expect(TestBed.inject(Router).url).toBe('/');
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('pop-out window'),
    );
    warn.mockRestore();
  });

  it('refuses an ordinary navigation too, so a link cannot leave the pop-out', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await setUpAt('/popout/reports');

    const moved = await TestBed.inject(Router).navigateByUrl('/reports');

    expect(moved).toBe(false);
    expect(TestBed.inject(Router).url).toBe('/');
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('pop-out window'),
    );
    warn.mockRestore();
  });

  it('navigates normally in the main window', async () => {
    const { service } = await setUpAt('/');

    await expect(service.navigate('reports')).resolves.toBe(true);
    expect(TestBed.inject(Router).url).toBe('/reports');
  });

  it('lets an ordinary navigation through in the main window', async () => {
    await setUpAt('/');

    await expect(
      TestBed.inject(Router).navigateByUrl('/reports'),
    ).resolves.toBe(true);
    expect(TestBed.inject(Router).url).toBe('/reports');
  });
});
