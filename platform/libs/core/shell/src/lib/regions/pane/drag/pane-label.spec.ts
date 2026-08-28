import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { VIEW_PANE_PREFIX } from '../tree/pane-address';
import { PaneTab } from '../tree/pane-node';
import {
  paneLabelOf,
  resolveTitle,
  surfaceClosable,
  toStripTab,
} from './pane-label';

@Component({ selector: 'lw-test-pane', template: '' })
class TestPane {}

const ROUTE: ContentRoute = {
  path: 'search',
  component: TestPane,
  title: 'testbed.search.title',
  icon: 'search',
};

const LITERAL_ROUTE: ContentRoute = {
  path: 'report',
  component: TestPane,
  title: 'Quarterly report',
  titleIsLiteral: true,
};

describe('resolveTitle', () => {
  it('translates a non-literal title', () => {
    expect(
      resolveTitle(
        { title: 'k.title', literalTitle: false },
        () => 'Translated',
      ),
    ).toBe('Translated');
  });

  it('returns a literal title verbatim', () => {
    expect(
      resolveTitle({ title: 'Verbatim', literalTitle: true }, () => 'nope'),
    ).toBe('Verbatim');
  });
});

describe('paneLabelOf', () => {
  function registry(): ContributionRegistry {
    const reg = TestBed.inject(ContributionRegistry);
    reg.addContentRoute(ROUTE);
    reg.addContentRoute(LITERAL_ROUTE);
    reg.addView({
      id: 'outline',
      region: 'primary',
      title: 'testbed.outline.title',
      icon: 'list',
      component: TestPane,
    });
    return reg;
  }

  it('labels the empty (home) path', () => {
    expect(paneLabelOf(registry(), '')).toEqual({
      title: 'content.split.home',
      literalTitle: false,
    });
  });

  it('labels a known view by its id', () => {
    expect(paneLabelOf(registry(), `${VIEW_PANE_PREFIX}outline`)).toEqual({
      title: 'testbed.outline.title',
      literalTitle: false,
      icon: 'list',
    });
  });

  it('falls back to a picker label for an unknown view', () => {
    expect(paneLabelOf(registry(), `${VIEW_PANE_PREFIX}ghost`)).toEqual({
      title: 'content.split.pick',
      literalTitle: false,
    });
  });

  it('labels a route from its declared title/icon', () => {
    expect(paneLabelOf(registry(), 'search')).toEqual({
      title: 'testbed.search.title',
      literalTitle: false,
      icon: 'search',
    });
  });

  it('honours a literal route title', () => {
    expect(paneLabelOf(registry(), 'report')).toEqual({
      title: 'Quarterly report',
      literalTitle: true,
      icon: undefined,
    });
  });

  it('labels an unmatched path as its literal path', () => {
    expect(paneLabelOf(registry(), 'unknown/path')).toEqual({
      title: 'unknown/path',
      literalTitle: true,
      icon: undefined,
    });
  });
});

describe('toStripTab', () => {
  function registry(): ContributionRegistry {
    const reg = TestBed.inject(ContributionRegistry);
    reg.addContentRoute(ROUTE);
    return reg;
  }

  it('derives title/icon from the route when the tab has none', () => {
    const tab: PaneTab = { path: 'search' };
    expect(toStripTab(registry(), tab)).toMatchObject({
      path: 'search',
      title: 'testbed.search.title',
      literalTitle: false,
      icon: 'search',
      closable: true,
      preview: false,
      pinned: false,
    });
  });

  it('prefers the tab-supplied title/icon and its flags', () => {
    const tab: PaneTab = {
      path: 'search',
      title: 'My tab',
      literalTitle: true,
      icon: 'star',
      preview: true,
      pinned: true,
      instance: 'inst-1',
    };
    expect(toStripTab(registry(), tab)).toMatchObject({
      title: 'My tab',
      literalTitle: true,
      icon: 'star',
      preview: true,
      pinned: true,
      instance: 'inst-1',
    });
  });
});

describe('toStripTab closable', () => {
  it('maps a workspace-declared unclosable tab to a strip tab without close affordance', () => {
    const reg = TestBed.inject(ContributionRegistry);
    expect(toStripTab(reg, { path: 'doc', closable: false }).closable).toBe(
      false,
    );
    expect(toStripTab(reg, { path: 'doc' }).closable).toBe(true);
  });
});

describe('surfaceClosable (K1d: Surface.closable)', () => {
  it('refuses closing where the surface declares it, for a route and for a view', () => {
    const reg = TestBed.inject(ContributionRegistry);
    reg.addContentRoute({ ...ROUTE, path: 'dashboard', closable: false });
    reg.addContentRoute(ROUTE);
    reg.addView({
      id: 'pinned-view',
      region: 'primary',
      title: 't',
      component: TestPane,
      closable: false,
    });

    expect(surfaceClosable(reg, 'dashboard')).toBe(false);
    expect(surfaceClosable(reg, 'search')).toBe(true);
    expect(surfaceClosable(reg, `${VIEW_PANE_PREFIX}pinned-view`)).toBe(false);
    expect(surfaceClosable(reg, `${VIEW_PANE_PREFIX}ghost`)).toBe(true);
    expect(surfaceClosable(reg, 'gone')).toBe(true);
    expect(toStripTab(reg, { path: 'dashboard' }).closable).toBe(false);
  });
});
