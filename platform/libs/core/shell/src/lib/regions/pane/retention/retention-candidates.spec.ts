import { TestBed } from '@angular/core/testing';
import { ChildrenOutletContexts, Router } from '@angular/router';
import { ContentRoute, View } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { ContentReuseStrategy } from '../../content/routing/content-reuse-strategy';
import { RetainedViewStash } from './retained-view-stash';
import { RetentionCandidates } from './retention-candidates';

const ownedView = { instance: 'owned view' };
const foreignView = { instance: 'foreign view' };
const ownedDoc = { instance: 'owned doc' };
const foreignDoc = { instance: 'foreign doc' };
const activeComponent = { instance: 'active outlet' };

function setup(url = '/doc/main'): RetentionCandidates {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: RetainedViewStash,
        useValue: {
          instances: () => [ownedView, foreignView],
          keyedInstances: () => [
            { key: 'left:main|view:testbed.outline|', instance: ownedView },
            { key: 'left:main|view:other.panel|', instance: foreignView },
          ],
        },
      },
      {
        provide: ContentReuseStrategy,
        useValue: {
          parkedHandles: () => [
            { key: 'doc/main', retained: false, instance: ownedDoc },
            { key: 'reports', retained: false, instance: foreignDoc },
          ],
        },
      },
      { provide: Router, useValue: { url } },
      {
        provide: ChildrenOutletContexts,
        useValue: {
          getContext: () => ({
            outlet: { isActivated: true, component: activeComponent },
          }),
        },
      },
    ],
  });
  const registry = TestBed.inject(ContributionRegistry);
  registry.addContentRoute(
    {
      path: 'doc/:id',
      title: 'd',
      component: class {},
    } as unknown as ContentRoute,
    'testbed',
  );
  registry.addContentRoute(
    {
      path: 'reports',
      title: 'r',
      component: class {},
    } as unknown as ContentRoute,
    'other',
  );
  registry.addView(
    {
      id: 'testbed.outline',
      region: 'primary',
      title: 'o',
      component: class {},
    } as unknown as View,
    'testbed',
  );
  registry.addView(
    {
      id: 'other.panel',
      region: 'primary',
      title: 'p',
      component: class {},
    } as unknown as View,
    'other',
  );
  return TestBed.inject(RetentionCandidates);
}

describe('RetentionCandidates', () => {
  it('all() aggregates stash instances, parked handles and the active outlet component', () => {
    const candidates = setup();

    expect(candidates.all()).toEqual([
      ownedView,
      foreignView,
      ownedDoc,
      foreignDoc,
      activeComponent,
    ]);
  });

  it('ofPlugin() keeps only instances whose surface the plugin registered', () => {
    const candidates = setup();

    expect(candidates.ofPlugin('testbed')).toEqual([
      ownedView,
      ownedDoc,
      activeComponent,
    ]);
    expect(candidates.ofPlugin('other')).toEqual([foreignView, foreignDoc]);
  });

  it('ofPlugin() excludes the active outlet when the URL matches no owned route', () => {
    const candidates = setup('/reports');

    expect(candidates.ofPlugin('testbed')).toEqual([ownedView, ownedDoc]);
  });
});
