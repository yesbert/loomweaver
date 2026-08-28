import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { provideLayout } from '../../layout/layout';
import { PanelGroupService } from './panel-group.service';
import { PanelState } from './panel-state';

@Component({ selector: 'lw-probe', template: '' })
class ProbeView {}

describe('PanelState', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('defaults to expanded and toggles collapse', () => {
    const panels = TestBed.inject(PanelState);

    expect(panels.isCollapsed('primary')).toBe(false);
    panels.toggle('primary');
    expect(panels.isCollapsed('primary')).toBe(true);
    panels.toggle('primary');
    expect(panels.isCollapsed('primary')).toBe(false);
  });

  it('persists collapse state across reloads', () => {
    TestBed.inject(PanelState).toggle('primary');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    expect(TestBed.inject(PanelState).isCollapsed('primary')).toBe(true);
  });

  it('expands a collapsed panel', () => {
    const panels = TestBed.inject(PanelState);

    panels.toggle('primary');
    panels.expand('primary');

    expect(panels.isCollapsed('primary')).toBe(false);
  });

  it('leaves a region holding no views expanded — the frame is the app’s, not the workspace’s', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideLayout({
          regions: [
            { id: 'primary', type: 'panel', dock: 'left' },
            { id: 'main', type: 'content', dock: 'center' },
          ],
        }),
      ],
    });
    const panels = TestBed.inject(PanelState);
    expect(TestBed.inject(PanelGroupService).tabs('primary')).toHaveLength(0);
    expect(panels.isCollapsed('primary')).toBe(false);

    TestBed.inject(ContributionRegistry).addView({
      id: 'v',
      region: 'primary',
      title: 't',
      component: ProbeView,
    });
    TestBed.inject(PanelGroupService).seed('primary');

    expect(panels.isCollapsed('primary')).toBe(false);
  });

  it('ignores a corrupted persisted payload (non-object / non-boolean values)', () => {
    localStorage.setItem(
      'lw.shell.panels',
      JSON.stringify(['not', 'an', 'object']),
    );
    expect(TestBed.inject(PanelState).isCollapsed('primary')).toBe(false);

    TestBed.resetTestingModule();
    localStorage.setItem(
      'lw.shell.panels',
      JSON.stringify({ primary: 'yes', secondary: true }),
    );
    const panels = TestBed.inject(PanelState);
    expect(panels.isCollapsed('primary')).toBe(false);
    expect(panels.isCollapsed('secondary')).toBe(true);
  });
});
