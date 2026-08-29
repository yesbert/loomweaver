import { ApplicationRef, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';
import { PRIMARY_PANE } from '../../pane/tree/pane-address';
import { WORKING_STATE_STORE } from '../../../persistence/working-state-store';
import { buildContentRoutes } from '../routing/content-router';
import { ContentTabsService } from './content-tabs.service';
import { provideTabAddressResolver } from './tab-address';

@Component({ selector: 'lw-test-content', template: '' })
class TestContent {}

const ROUTES: readonly ContentRoute[] = [
  { path: '', component: TestContent },
  { path: 'doc/:id', component: TestContent, id: 'testbed.doc' },
  { path: 'dashboard/overview', component: TestContent, title: 'k.dash' },
  { path: 'reports', component: TestContent, title: 'k.reports' },
  { path: 'note/:id', component: TestContent, subRoutes: ['preview'] },
];

describe('OpenTabsService re-reconciles after async hydration (LWF-02b)', () => {
  it('keeps the auto-opened deep-link tab after the pane tree hydrates', async () => {
    let resolve!: (raw: string | undefined) => void;
    const set = vi.fn(() => Promise.resolve());
    TestBed.configureTestingModule({
      providers: [
        provideRouter(buildContentRoutes(ROUTES)),
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
      ],
    });
    const registry = TestBed.inject(ContributionRegistry);
    for (const route of ROUTES) registry.addContentRoute(route);
    const service = TestBed.inject(ContentTabsService);
    const harness = await RouterTestingHarness.create();

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


describe('OpenTabsService strip without groups', () => {
  const MIXED: readonly ContentRoute[] = [
    { path: '', component: TestContent },
    { path: 'doc/:id', component: TestContent },
    { path: 'run/:id', component: TestContent },
    { path: 'dashboard/overview', component: TestContent, title: 'k.dash' },
    { path: 'login', component: TestContent, chromeless: true },
  ];

  let service: ContentTabsService;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter(buildContentRoutes(MIXED))],
    });
    const registry = TestBed.inject(ContributionRegistry);
    for (const route of MIXED) registry.addContentRoute(route);
    service = TestBed.inject(ContentTabsService);
    harness = await RouterTestingHarness.create();
  });

  it('shows every open tab side by side, whichever one is active', async () => {
    service.open({ path: 'doc/a', title: 'A' });
    service.open({ path: 'run/7', title: 'R' });
    await harness.navigateByUrl('/doc/a');

    expect(service.tabs().map((tab) => tab.path)).toEqual(['doc/a', 'run/7']);

    await harness.navigateByUrl('/run/7');

    expect(service.tabs().map((tab) => tab.path)).toEqual(['doc/a', 'run/7']);
  });

  it('visiting a plain surface route auto-opens a closable tab', async () => {
    await harness.navigateByUrl('/dashboard/overview');

    expect(
      service.tabs().find((tab) => tab.path === 'dashboard/overview'),
    ).toMatchObject({ title: 'k.dash', literalTitle: false, closable: true });
    expect(service.showStrip()).toBe(true);
  });

  it('a chromeless surface never becomes a tab and shows no strip', async () => {
    service.open({ path: 'doc/a', title: 'A' });
    await harness.navigateByUrl('/login');

    expect(service.showStrip()).toBe(false);
    expect(service.tabs().some((tab) => tab.path === 'login')).toBe(false);

    await harness.navigateByUrl('/doc/a');
    expect(service.showStrip()).toBe(true);
  });

  it('shows no strip while the pane holds no tabs at all', async () => {
    await harness.navigateByUrl('/');

    expect(service.showStrip()).toBe(false);
    expect(service.tabs()).toEqual([]);
  });

  it('closes every open tab in one go', async () => {
    service.open({ path: 'doc/a', title: 'A' });
    service.open({ path: 'run/7', title: 'R' });
    await harness.navigateByUrl('/run/7');

    service.closeAll();

    expect(service.tabs()).toEqual([]);
  });
});

describe('OpenTabsService following tabs (§7)', () => {
  const FACETS: readonly ContentRoute[] = [
    { path: '', component: TestContent },
    {
      path: 'cedents/:cedentId/programs/:programId/pricing',
      component: TestContent,
      follows: true,
      title: 'k.pricing',
      order: 0,
    },
    {
      path: 'cedents/:cedentId/programs/:programId/treaties',
      component: TestContent,
      follows: true,
      title: 'k.treaties',
      order: 1,
    },
    { path: 'settings', component: TestContent, title: 'k.settings' },
  ];

  async function setup(providers: unknown[] = []) {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(buildContentRoutes(FACETS)),
        ...(providers as never[]),
      ],
    });
    const registry = TestBed.inject(ContributionRegistry);
    for (const route of FACETS) registry.addContentRoute(route);
    const service = TestBed.inject(ContentTabsService);
    const harness = await RouterTestingHarness.create();
    return { service, harness };
  }

  const navPathOf = (service: ContentTabsService, title: string) =>
    service.tabs().find((tab) => tab.title === title)?.navPath;

  it('points a following tab at the current selection', async () => {
    const { service, harness } = await setup();

    await harness.navigateByUrl('/cedents/US003950/programs/205470/pricing');

    expect(navPathOf(service, 'k.treaties')).toBe(
      'cedents/US003950/programs/205470/treaties',
    );
  });

  it('leaves an open tab that did not opt in on its own address', async () => {
    const { service, harness } = await setup();
    await harness.navigateByUrl('/settings');

    await harness.navigateByUrl('/cedents/US003950/programs/205470/pricing');

    expect(navPathOf(service, 'k.settings')).toBe('settings');
  });

  it('truncates before a value it does not know, and lands on whoever owns that prefix', async () => {
    const { service, harness } = await setup();
    TestBed.inject(ContributionRegistry).addContentRoute({
      path: 'cedents',
      component: TestContent,
    } as ContentRoute);

    await harness.navigateByUrl('/settings');

    expect(navPathOf(service, 'k.treaties')).toBe('cedents');
  });

  it('leaves a following tab out while its address is nowhere to go', async () => {
    const { service, harness } = await setup();

    await harness.navigateByUrl('/settings');

    expect(service.tabs().map((tab) => tab.title)).toEqual(['k.settings']);
  });

  it('lets the distribution override the computation, per tab', async () => {
    const { service, harness } = await setup([
      provideTabAddressResolver(({ surfaceId, params }) =>
        surfaceId === 'treaties'
          ? `cedents/${params['cedentId']}/treaties/881498`
          : null,
      ),
    ]);
    const registry = TestBed.inject(ContributionRegistry);
    registry.addContentRoute({
      ...FACETS[2],
      id: 'treaties',
      path: 'cedents/:cedentId/programs/:programId/treaties',
      follows: true,
    } as ContentRoute);

    await harness.navigateByUrl('/cedents/US003950/programs/205470/pricing');

    expect(navPathOf(service, 'k.treaties')).toBe(
      'cedents/US003950/treaties/881498',
    );
    expect(navPathOf(service, 'k.pricing')).toBe(
      'cedents/US003950/programs/205470/pricing',
    );
  });

  it('never rewrites a tab held by another pane — that copy freezes (§8)', async () => {
    const { service, harness } = await setup();
    await harness.navigateByUrl('/cedents/US003950/programs/205470/pricing');
    const paneTree = TestBed.inject(PaneTreeService);
    paneTree.splitPane(
      'content',
      PRIMARY_PANE,
      'row',
      'cedents/US003950/programs/205470/treaties',
    );

    await harness.navigateByUrl('/cedents/US009999/programs/111111/pricing');

    const split = paneTree.tree('content') as {
      second: { tabs: readonly { path: string }[] };
    };
    expect(split.second.tabs[0].path).toBe(
      'cedents/US003950/programs/205470/treaties',
    );
    expect(navPathOf(service, 'k.treaties')).toBe(
      'cedents/US009999/programs/111111/treaties',
    );
  });
});
