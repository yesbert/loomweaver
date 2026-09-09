import { signal } from '@angular/core';
import { EMPTY } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { ChildrenOutletContexts, Router } from '@angular/router';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { ContentReuseStrategy } from '../../content/routing/content-reuse-strategy';
import { PaneTreeService } from '../tree/pane-tree.service';
import { RetainedViewStash } from './retained-view-stash';
import { UnsavedWork } from './unsaved-work';

const CONTENT_SCOPE = 'content:main';

interface Entry {
  readonly key: string;
  readonly instance: unknown;
}

function dirtySurface(dirty: boolean): unknown {
  return { surfaceDirty: () => dirty };
}

function throwingSurface(): unknown {
  return {
    surfaceDirty: (): boolean => {
      throw new Error('reporting is broken');
    },
  };
}

function setup(options: {
  entries?: readonly Entry[];
  parked?: readonly { key: string; instance: unknown }[];
  activeUrl?: string;
  outlet?: unknown;
}): UnsavedWork {
  const entries = options.entries ?? [];
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      {
        provide: RetainedViewStash,
        useValue: {
          version: signal(0),
          keyedInstances: () => [...entries],
          instancesFor: (scope: string, path: string) =>
            entries
              .filter(
                (entry) =>
                  entry.key === `${scope}|${path}` ||
                  entry.key.startsWith(`${scope}|${path}|`),
              )
              .map((entry) => entry.instance),
        },
      },
      {
        provide: ContentReuseStrategy,
        useValue: {
          version: signal(0),
          parkedHandles: () => options.parked ?? [],
        },
      },
      {
        provide: PaneTreeService,
        useValue: { primaryId: () => 'main' },
      },
      {
        provide: Router,
        useValue: { url: options.activeUrl ?? '/', events: EMPTY },
      },
      {
        provide: ChildrenOutletContexts,
        useValue: {
          getContext: () =>
            options.outlet === undefined
              ? undefined
              : { outlet: { isActivated: true, component: options.outlet } },
        },
      },
    ],
  });
  const registry = TestBed.inject(ContributionRegistry);
  registry.addContentRoute(
    { path: 'quotes/:id', title: 'q', component: class {} } as unknown as ContentRoute,
    'sales',
  );
  return TestBed.inject(UnsavedWork);
}

describe('UnsavedWork', () => {
  it('answers no for an address whose surface is saved', () => {
    const work = setup({
      entries: [{ key: `${CONTENT_SCOPE}|quotes/q-7`, instance: dirtySurface(false) }],
    });

    expect(work.at(CONTENT_SCOPE, 'quotes/q-7')).toBe(false);
  });

  it('answers yes for an address whose surface is unsaved', () => {
    const work = setup({
      entries: [{ key: `${CONTENT_SCOPE}|quotes/q-7`, instance: dirtySurface(true) }],
    });

    expect(work.at(CONTENT_SCOPE, 'quotes/q-7')).toBe(true);
  });

  it('answers yes for an arrangement one of whose children is unsaved', () => {
    const work = setup({
      entries: [
        { key: `${CONTENT_SCOPE}|quotes/q-7`, instance: dirtySurface(false) },
        {
          key: 'container@quotes/q-7:main|quotes/q-7/positions',
          instance: dirtySurface(false),
        },
        {
          key: 'container@quotes/q-7:main|quotes/q-7/customer',
          instance: dirtySurface(true),
        },
      ],
    });

    expect(work.at(CONTENT_SCOPE, 'quotes/q-7')).toBe(true);
  });

  it('answers no for an address with nothing open', () => {
    const work = setup({
      entries: [{ key: `${CONTENT_SCOPE}|quotes/q-7`, instance: dirtySurface(true) }],
    });

    expect(work.at(CONTENT_SCOPE, 'quotes/q-9')).toBe(false);
    expect(work.instancesAt(CONTENT_SCOPE, 'quotes/q-9')).toEqual([]);
  });

  it('answers yes for a surface whose report throws, rather than risking the work', () => {
    const work = setup({
      entries: [{ key: `${CONTENT_SCOPE}|quotes/q-7`, instance: throwingSurface() }],
    });

    expect(work.at(CONTENT_SCOPE, 'quotes/q-7')).toBe(true);
  });

  it('reaches the routed surface of the content pane, active or parked', () => {
    const active = setup({
      activeUrl: '/quotes/q-7',
      outlet: dirtySurface(true),
    });

    expect(active.at(CONTENT_SCOPE, 'quotes/q-7')).toBe(true);

    const parked = setup({
      parked: [{ key: 'quotes/q-7', instance: dirtySurface(true) }],
    });

    expect(parked.at(CONTENT_SCOPE, 'quotes/q-7')).toBe(true);
  });

  it('reads a deep address through the tab it is rooted at', () => {
    const work = setup({
      entries: [{ key: `${CONTENT_SCOPE}|quotes/q-7`, instance: dirtySurface(true) }],
    });

    expect(work.at(CONTENT_SCOPE, 'quotes/q-7/customer')).toBe(true);
  });

  it('leaves the routed surface out of a pane that is not the content pane', () => {
    const work = setup({
      activeUrl: '/quotes/q-7',
      outlet: dirtySurface(true),
    });

    expect(work.at('left:main', 'quotes/q-7')).toBe(false);
  });
});
