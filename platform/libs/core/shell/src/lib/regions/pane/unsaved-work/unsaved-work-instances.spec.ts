import { TestBed } from '@angular/core/testing';
import { ContentRoute, View } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { RetainedViewStash } from '../retention/retained-view-stash';
import { UnsavedWork } from './unsaved-work';

const ownedView = { instance: 'owned view' };
const foreignView = { instance: 'foreign view' };
const ownedDocument = { instance: 'owned doc' };
const foreignDocument = { instance: 'foreign doc' };

function setup(): UnsavedWork {
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
  return TestBed.inject(UnsavedWork);
}

describe('UnsavedWork, the instances that may hold it', () => {
  it('instancesEverywhere() is every instance the panes keep, the pane carrying the address included', () => {
    const candidates = setup();

    expect(candidates.instancesEverywhere()).toEqual([
      ownedView,
      foreignView,
      ownedDocument,
      foreignDocument,
    ]);
  });

  it('instancesOfPlugin() keeps only instances whose surface the plugin registered', () => {
    const candidates = setup();

    expect(candidates.instancesOfPlugin('testbed')).toEqual([
      ownedView,
      ownedDocument,
    ]);
    expect(candidates.instancesOfPlugin('other')).toEqual([
      foreignView,
      foreignDocument,
    ]);
  });
});
