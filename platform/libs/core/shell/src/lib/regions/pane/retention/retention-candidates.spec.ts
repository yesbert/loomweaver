import { TestBed } from '@angular/core/testing';
import { ContentRoute, View } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { RetainedViewStash } from './retained-view-stash';
import { RetentionCandidates } from './retention-candidates';

const ownedView = { instance: 'owned view' };
const foreignView = { instance: 'foreign view' };
const ownedDocument = { instance: 'owned doc' };
const foreignDocument = { instance: 'foreign doc' };

function setup(): RetentionCandidates {
  const kept = [
    { key: 'left:main|view:testbed.outline|', instance: ownedView },
    { key: 'left:main|view:other.panel|', instance: foreignView },
    { key: 'content:main|doc/main', instance: ownedDocument },
    { key: 'content:main|reports', instance: foreignDocument },
  ];
  TestBed.configureTestingModule({
    providers: [
      {
        provide: RetainedViewStash,
        useValue: {
          instances: () => kept.map((entry) => entry.instance),
          keyedInstances: () => kept,
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
  it('all() is every instance the panes keep, the pane carrying the address included', () => {
    const candidates = setup();

    expect(candidates.all()).toEqual([
      ownedView,
      foreignView,
      ownedDocument,
      foreignDocument,
    ]);
  });

  it('ofPlugin() keeps only instances whose surface the plugin registered', () => {
    const candidates = setup();

    expect(candidates.ofPlugin('testbed')).toEqual([ownedView, ownedDocument]);
    expect(candidates.ofPlugin('other')).toEqual([
      foreignView,
      foreignDocument,
    ]);
  });
});
