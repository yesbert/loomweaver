import { TestBed } from '@angular/core/testing';
import {
  RailItemsService,
  isWorkspaceRailItem,
  workspaceRailItemId,
} from './rail-items.service';

describe('RailItemsService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('shows a registered entry until it is hidden, and a workspace entry only once it is placed', () => {
    const rail = TestBed.inject(RailItemsService);
    const workspace = workspaceRailItemId('w1');

    expect(rail.isVisible('settings')).toBe(true);
    expect(rail.isVisible(workspace)).toBe(false);

    rail.toggle('settings', 'activity');
    rail.toggle(workspace, 'activity');

    expect(rail.isVisible('settings')).toBe(false);
    expect(rail.isVisible(workspace)).toBe(true);
  });

  it('keeps an entry in exactly one rail', () => {
    const rail = TestBed.inject(RailItemsService);

    expect(rail.regionOf('settings', 'activity')).toBe('activity');

    rail.show('settings', 'activity-right');

    expect(rail.regionOf('settings', 'activity')).toBe('activity-right');
  });

  it('brings a hidden entry back into the rail it is shown from', () => {
    const rail = TestBed.inject(RailItemsService);

    rail.hide('settings');
    rail.show('settings', 'activity-right');

    expect(rail.isVisible('settings')).toBe(true);
    expect(rail.regionOf('settings', 'activity')).toBe('activity-right');
  });

  it('forgets where a workspace entry sat when it is hidden', () => {
    const rail = TestBed.inject(RailItemsService);
    const workspace = workspaceRailItemId('w1');

    rail.show(workspace, 'activity-right');
    rail.hide(workspace);

    expect(rail.isVisible(workspace)).toBe(false);
    expect(rail.regionOf(workspace, 'activity')).toBe('activity');
  });

  it('persists across reloads', () => {
    TestBed.inject(RailItemsService).show('auth', 'activity-right');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    expect(TestBed.inject(RailItemsService).regionOf('auth', 'activity')).toBe(
      'activity-right',
    );
  });

  it('ignores a corrupted persisted payload', () => {
    localStorage.setItem('lw.shell.rail-items', '["not", "a", "map"]');

    expect(TestBed.inject(RailItemsService).isVisible('settings')).toBe(true);
  });

  it('recognises a workspace entry by its id', () => {
    expect(isWorkspaceRailItem(workspaceRailItemId('w1'))).toBe(true);
    expect(isWorkspaceRailItem('settings')).toBe(false);
  });
});
