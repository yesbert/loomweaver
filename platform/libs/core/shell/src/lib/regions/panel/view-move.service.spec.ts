import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ShellLayout, SHELL_LAYOUT } from '../../layout/layout';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { PRIMARY_PANE } from '../pane/tree/pane-address';
import { PaneTreeService } from '../pane/tree/pane-tree.service';
import { ViewMoveService } from './view-move.service';
import { PanelState } from './panel-state';
import { SidebarService } from './sidebar.service';
import { FeatureSwitches } from '../../features/feature-switches.service';
import { DialogService } from '../../dialog/dialog.service';
import { UnsavedWork } from '../pane/unsaved-work/unsaved-work';
import type { MockInstance } from 'vitest';

const EN = {
  panel: {
    viewMove: {
      announce: '{{view}} moved to {{target}}',
      targetLeft: 'left sidebar',
      targetRight: 'right sidebar',
    },
  },
};

const LAYOUT: ShellLayout = {
  regions: [
    { id: 'activity', type: 'rail', dock: 'left' },
    { id: 'primary', type: 'panel', dock: 'left' },
    { id: 'secondary', type: 'panel', dock: 'right' },
    { id: 'main', type: 'content', dock: 'center' },
  ],
};

const Cmp = class {} as Type<unknown>;

describe('ViewMoveService (as a moveTab special case)', () => {
  let service: ViewMoveService;
  let paneTree: PaneTreeService;
  let announce: MockInstance;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { en: EN },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [
        { provide: SHELL_LAYOUT, useValue: LAYOUT },
        provideRouter([]),
      ],
    });
    service = TestBed.inject(ViewMoveService);
    paneTree = TestBed.inject(PaneTreeService);
    announce = vi.spyOn(TestBed.inject(LiveAnnouncer), 'announce');
    TestBed.inject(ContributionRegistry).addView({
      id: 'v1',
      region: 'primary',
      title: 'v1',
      component: Cmp,
    });
  });

  describe('otherPanel', () => {
    it('returns the panel on the opposite dock', () => {
      expect(service.otherPanel('primary')).toBe('secondary');
      expect(service.otherPanel('secondary')).toBe('primary');
    });

    it('returns undefined for an unknown region or when no opposite-dock panel exists', () => {
      expect(service.otherPanel('nope')).toBeUndefined();
      expect(service.otherPanel('main')).toBe('primary');
    });
  });

  describe('move', () => {
    it('inserts an unplaced view into the target primary group and activates it', () => {
      service.move('v1', 'secondary');
      expect(paneTree.primaryTabs('secondary').map((tab) => tab.path)).toEqual([
        'view:v1',
      ]);
      expect(paneTree.sourceOf('view:v1')).toEqual({
        dock: 'secondary',
        paneId: PRIMARY_PANE,
      });
    });

    it('MOVES a placed view tab between primary groups (the source loses it)', () => {
      paneTree.seedPrimaryTabs('primary', ['view:v1']);

      service.move('v1', 'secondary');

      expect(paneTree.primaryTabs('primary')).toEqual([]);
      expect(paneTree.primaryTabs('secondary').map((tab) => tab.path)).toEqual([
        'view:v1',
      ]);
    });

    it('re-activates a view already living in the target (no duplicate)', () => {
      paneTree.seedPrimaryTabs('secondary', ['view:other', 'view:v1']);

      service.move('v1', 'secondary');

      expect(paneTree.primaryTabs('secondary').map((tab) => tab.path)).toEqual([
        'view:other',
        'view:v1',
      ]);
    });

    it('announces the move with a localized target sidebar name', () => {
      service.move('v1', 'secondary');

      expect(announce).toHaveBeenCalledWith('v1 moved to right sidebar');
    });
  });

  describe('a move into a collapsed sidebar', () => {
    function collapseSecondary(): PanelState {
      const panels = TestBed.inject(PanelState);
      panels.toggle('secondary');
      return panels;
    }

    it('expands the sidebar the view was moved into', () => {
      const panels = collapseSecondary();

      service.move('v1', 'secondary');

      expect(panels.isCollapsed('secondary')).toBe(false);
    });

    it('leaves the sidebar collapsed while collapsing is switched off, with the view in it', () => {
      const panels = collapseSecondary();
      TestBed.inject(FeatureSwitches).update({ sidebar: { collapse: false } });

      service.move('v1', 'secondary');

      expect(panels.isCollapsed('secondary')).toBe(true);
      expect(paneTree.sourceOf('view:v1')?.dock).toBe('secondary');
    });

    it('leaves the sidebar collapsed for a parked tab too while collapsing is switched off', () => {
      const panels = collapseSecondary();
      TestBed.inject(FeatureSwitches).update({ sidebar: { collapse: false } });
      paneTree.seedPrimaryTabs('primary', ['notes/today']);

      service.moveTab(
        { dock: 'primary', paneId: PRIMARY_PANE },
        { path: 'notes/today', title: 'Today', literalTitle: true },
        'secondary',
      );

      expect(panels.isCollapsed('secondary')).toBe(true);
      expect(paneTree.sourceOf('notes/today')?.dock).toBe('secondary');
    });

    it('still expands when the distribution asks for it from its own code', () => {
      const panels = collapseSecondary();
      TestBed.inject(FeatureSwitches).update({ sidebar: { collapse: false } });
      service.move('v1', 'secondary');

      TestBed.inject(SidebarService).expand('secondary');

      expect(panels.isCollapsed('secondary')).toBe(false);
    });
  });

  describe('a move that first asks about unsaved work', () => {
    let panels: PanelState;

    beforeEach(() => {
      panels = TestBed.inject(PanelState);
      panels.toggle('secondary');
      vi.spyOn(TestBed.inject(UnsavedWork), 'lostBy').mockReturnValue([
        { surfaceDirty: () => true },
      ]);
    });

    function answer(choice: 'discard' | 'cancel'): void {
      TestBed.inject(DialogService).dialogs().at(-1)?.ref.close(choice);
    }

    const settled = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

    it('announces nothing and leaves the sidebar collapsed while the question stands, and after Cancel', async () => {
      paneTree.seedPrimaryTabs('primary', ['view:v1']);

      const moved = service.move('v1', 'secondary');
      await settled();

      expect(TestBed.inject(DialogService).dialogs().length).toBe(1);
      expect(panels.isCollapsed('secondary')).toBe(true);
      expect(announce).not.toHaveBeenCalled();

      answer('cancel');

      await expect(moved).resolves.toBe(false);
      expect(paneTree.sourceOf('view:v1')?.dock).toBe('primary');
      expect(panels.isCollapsed('secondary')).toBe(true);
      expect(announce).not.toHaveBeenCalled();
    });

    it('announces the view and expands the sidebar once the move has happened', async () => {
      paneTree.seedPrimaryTabs('primary', ['view:v1']);

      const moved = service.move('v1', 'secondary');
      await settled();
      answer('discard');

      await expect(moved).resolves.toBe(true);
      expect(paneTree.sourceOf('view:v1')?.dock).toBe('secondary');
      expect(panels.isCollapsed('secondary')).toBe(false);
      expect(announce).toHaveBeenCalledWith('v1 moved to right sidebar');
    });

    it('announces nothing for a parked tab whose move was cancelled', async () => {
      paneTree.seedPrimaryTabs('primary', ['notes/today']);

      const moved = service.moveTab(
        { dock: 'primary', paneId: PRIMARY_PANE },
        { path: 'notes/today', title: 'Today', literalTitle: true },
        'secondary',
      );
      await settled();
      answer('cancel');

      await expect(moved).resolves.toBe(false);
      expect(paneTree.sourceOf('notes/today')?.dock).toBe('primary');
      expect(panels.isCollapsed('secondary')).toBe(true);
      expect(announce).not.toHaveBeenCalled();
    });
  });

  describe('moveTab', () => {
    it('announces a moved tab by the title it shows', async () => {
      paneTree.seedPrimaryTabs('primary', ['notes/today']);

      await service.moveTab(
        { dock: 'primary', paneId: PRIMARY_PANE },
        { path: 'notes/today', title: 'Today', literalTitle: true },
        'secondary',
      );

      expect(paneTree.primaryTabs('secondary').map((tab) => tab.path)).toEqual([
        'notes/today',
      ]);
      expect(announce).toHaveBeenCalledWith('Today moved to right sidebar');
    });
  });
});
