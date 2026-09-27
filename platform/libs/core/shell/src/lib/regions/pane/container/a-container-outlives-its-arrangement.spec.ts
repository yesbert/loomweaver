import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ContainerSpec } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../contributions/contribution-registry';
import { CONTAINER_CHILD_REGION } from '../../../contributions/surface-normalize';
import { activeTab } from '../tree/pane-node';
import { collectLeafIds, findLeaf } from '../tree/pane-queries';
import { PaneTreeService } from '../tree/pane-tree.service';
import { containerDockFor } from './container-children';
import { ContainerPaneHost } from './container-pane-host';

@Component({ selector: 'lw-test-child', template: '' })
class TestChild {}

const SPEC: ContainerSpec = {
  children: [
    { surface: 't.a', segment: 'a' },
    { surface: 't.b', segment: 'b' },
  ],
  initial: ['t.a', 't.b'],
};

const DOCK = containerDockFor('box');

describe('a container whose arrangement is replaced while it is open', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  let paneTree: PaneTreeService;

  const paneId = () => collectLeafIds(paneTree.tree(DOCK))[0];
  const leaf = () => findLeaf(paneTree.tree(DOCK), paneId());

  async function settle(): Promise<void> {
    for (let turn = 0; turn < 3; turn += 1) {
      await harness.fixture.whenStable();
      harness.detectChanges();
    }
  }

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { en: { t: { a: 'Alpha', b: 'Beta' } } },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [
        provideRouter([
          {
            path: 'box',
            component: ContainerPaneHost,
            data: { container: SPEC },
            children: ['', 'a', 'b'].map((path) => ({
              path,
              pathMatch: 'full' as const,
              component: TestChild,
            })),
          },
        ]),
      ],
    });
    const registry = TestBed.inject(ContributionRegistry);
    registry.addContentRoute({ id: 'box', path: 'box', container: SPEC });
    for (const id of ['t.a', 't.b']) {
      registry.addView({
        id,
        title: id,
        region: CONTAINER_CHILD_REGION,
        component: TestChild,
      });
    }
    paneTree = TestBed.inject(PaneTreeService);
    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/box/b');
    await settle();
  });

  it('lays out its children again, on the child its address names', async () => {
    paneTree.hydrate(undefined);
    await settle();

    const drawn = leaf();
    expect(drawn?.tabs.map((tab) => tab.path)).toEqual(['box/a', 'box/b']);
    expect(drawn && activeTab(drawn)?.path).toBe('box/b');
  });

  it('keeps the address on the child', async () => {
    paneTree.hydrate(undefined);
    await settle();

    expect(router.url).toBe('/box/b');
  });

  it('still moves the address with the child the person picks', async () => {
    paneTree.setActiveTab(DOCK, paneId(), 'box/a');
    await settle();

    expect(router.url).toBe('/box/a');
  });
});
