import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ShellLayout, SHELL_LAYOUT } from '../../layout/layout';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { PRIMARY_PANE } from '../pane/tree/pane-address';
import { PaneTreeService } from '../pane/tree/pane-tree.service';
import { ViewMoveService } from './view-move.service';
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

    it('MOVES a placed view tab between primary groups (the source loses it, R2)', () => {
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
});
