import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthSnapshot } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { AUTH_SOURCE } from '../../auth/auth-context';
import { PRIMARY_PANE } from '../pane/tree/pane-address';
import { PaneTreeService } from '../pane/tree/pane-tree.service';
import { HiddenViewsService } from './hidden-views.service';
import { PanelGroupService } from './panel-group.service';

@Component({ selector: 'lw-group-stub', template: '' })
class Stub {}

describe('PanelGroupService (the sidebar primary group, tree-owned)', () => {
  let group: PanelGroupService;
  let paneTree: PaneTreeService;
  let registry: ContributionRegistry;
  const auth = signal<AuthSnapshot>({
    authenticated: false,
    roles: [],
    claims: {},
  });

  beforeEach(() => {
    localStorage.clear();
    auth.set({ authenticated: false, roles: [], claims: {} });
    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_SOURCE, useValue: auth }],
    });
    group = TestBed.inject(PanelGroupService);
    paneTree = TestBed.inject(PaneTreeService);
    registry = TestBed.inject(ContributionRegistry);
    registry.addView({
      id: 'nav',
      region: 'primary',
      title: 'nav',
      component: Stub,
    });
    registry.addView({
      id: 'outline',
      region: 'primary',
      title: 'outline',
      component: Stub,
    });
  });

  it('seeds declared views into their region primary group once (idempotent)', () => {
    group.seed('primary');
    expect(paneTree.primaryTabs('primary').map((tab) => tab.path)).toEqual([
      'view:nav',
      'view:outline',
    ]);
    expect(group.activePath('primary')).toBe('view:nav');

    group.seed('primary');
    expect(paneTree.primaryTabs('primary').map((tab) => tab.path)).toEqual([
      'view:nav',
      'view:outline',
    ]);
  });

  it('seeds a gated declared view before any session exists and hides it until the session qualifies (TreeWeaver #40)', () => {
    registry.addView({
      id: 'catalog',
      region: 'primary',
      title: 'catalog',
      component: Stub,
      access: { authenticated: true },
    });

    group.seed('primary');

    expect(paneTree.primaryTabs('primary').map((tab) => tab.path)).toEqual([
      'view:nav',
      'view:outline',
      'view:catalog',
    ]);
    expect(group.tabs('primary').map((tab) => tab.path)).toEqual([
      'view:nav',
      'view:outline',
    ]);

    auth.set({ authenticated: true, roles: [], claims: {} });
    expect(group.tabs('primary').map((tab) => tab.path)).toEqual([
      'view:nav',
      'view:outline',
      'view:catalog',
    ]);
  });

  it('never re-seeds a view whose tab lives in ANOTHER dock (a moved view stays moved)', () => {
    paneTree.seedPrimaryTabs('content', ['view:outline']);

    group.seed('primary');

    expect(paneTree.primaryTabs('primary').map((tab) => tab.path)).toEqual([
      'view:nav',
    ]);
  });

  it('re-seeds a view whose tab vanished everywhere (it returns home)', () => {
    group.seed('primary');
    paneTree.setPrimaryTabs('primary', []);

    group.seed('primary');

    expect(paneTree.primaryTabs('primary').map((tab) => tab.path)).toEqual([
      'view:nav',
      'view:outline',
    ]);
  });

  it('hides (not deletes) a stored view tab whose view is missing or auth-gated', () => {
    registry.addView({
      id: 'admin',
      region: 'primary',
      title: 'a',
      component: Stub,
      access: { anyRole: ['admin'] },
    });
    paneTree.seedPrimaryTabs('primary', [
      'view:nav',
      'view:gone',
      'view:admin',
    ]);

    expect(group.tabs('primary').map((tab) => tab.path)).toEqual(['view:nav']);
    expect(paneTree.primaryTabs('primary')).toHaveLength(3);

    auth.set({ authenticated: true, roles: ['admin'], claims: {} });
    expect(group.tabs('primary').map((tab) => tab.path)).toEqual([
      'view:nav',
      'view:admin',
    ]);
  });

  it('falls back to the first displayable tab when the stored active is hidden', () => {
    paneTree.seedPrimaryTabs('primary', ['view:gone', 'view:outline']);
    paneTree.setActiveTab('primary', PRIMARY_PANE, 'view:gone');

    expect(group.activePath('primary')).toBe('view:outline');
  });

  it('content tabs in a sidebar group always display (the synthetic mount renders them)', () => {
    paneTree.seedPrimaryTabs('primary', ['doc/abc']);
    expect(group.tabs('primary').map((tab) => tab.path)).toEqual(['doc/abc']);
  });

  describe('hidden views', () => {
    let hidden: HiddenViewsService;

    beforeEach(() => {
      hidden = TestBed.inject(HiddenViewsService);
    });

    it('never resurrects a hidden view', () => {
      hidden.hide('outline');

      group.seed('primary');

      expect(paneTree.primaryTabs('primary').map((tab) => tab.path)).toEqual([
        'view:nav',
      ]);
    });

    it('prunes a hidden view’s tab out of the primary group (self-healing)', () => {
      paneTree.seedPrimaryTabs('primary', ['view:nav', 'view:outline']);
      hidden.hide('outline');

      group.seed('primary');

      expect(paneTree.primaryTabs('primary').map((tab) => tab.path)).toEqual([
        'view:nav',
      ]);
    });

    it('re-seeds a revealed view at its declared position, not at the end', () => {
      hidden.hide('nav');
      group.seed('primary');
      expect(paneTree.primaryTabs('primary').map((tab) => tab.path)).toEqual([
        'view:outline',
      ]);

      hidden.show('nav');
      group.seed('primary');

      expect(paneTree.primaryTabs('primary').map((tab) => tab.path)).toEqual([
        'view:nav',
        'view:outline',
      ]);
    });
  });
});
