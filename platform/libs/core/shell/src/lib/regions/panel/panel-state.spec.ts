import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { provideLayout } from '../../layout/layout';
import { PanelGroupService } from './panel-group.service';
import { PanelState } from './panel-state';
import { ViewportService } from '../../layout/viewport.service';
import { KeyValueStore } from '../../persistence/key-value-store';
import { provideWorkingStateStore } from '../../persistence/working-state-store';

@Component({ selector: 'lw-probe', template: '' })
class ProbeView {}

class HandAnsweredStore implements KeyValueStore {
  readonly written = new Map<string, string>();
  private readonly waiting: ((raw: string | undefined) => void)[] = [];

  get(): Promise<string | undefined> {
    return new Promise((resolve) => {
      this.waiting.push(resolve);
    });
  }

  set(key: string, value: string): Promise<void> {
    this.written.set(key, value);
    return Promise.resolve();
  }

  delete(key: string): Promise<void> {
    this.written.delete(key);
    return Promise.resolve();
  }

  async answer(raw: string | undefined): Promise<void> {
    for (const resolve of this.waiting.splice(0)) {
      resolve(raw);
    }
    await Promise.resolve();
    await Promise.resolve();
  }
}

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

describe('PanelState on a store that answers later', () => {
  it('keeps a sidebar collapsed before the store answered, beside what the store held', async () => {
    const store = new HandAnsweredStore();
    TestBed.configureTestingModule({
      providers: [provideWorkingStateStore(store)],
    });
    const panels = TestBed.inject(PanelState);

    panels.toggle('primary');
    expect(panels.isCollapsed('primary')).toBe(true);
    await store.answer(JSON.stringify({ secondary: true }));

    expect(panels.isCollapsed('primary')).toBe(true);
    expect(panels.isCollapsed('secondary')).toBe(true);
    expect(JSON.parse(store.written.get('lw.shell.panels') ?? '{}')).toEqual({
      primary: true,
      secondary: true,
    });
  });
});

describe('PanelState drawer', () => {
  function onViewport() {
    localStorage.clear();
    const compact = signal(true);
    TestBed.configureTestingModule({
      providers: [{ provide: ViewportService, useValue: { compact } }],
    });
    return { compact, panels: TestBed.inject(PanelState) };
  }

  it('does not reopen by itself when a window that became wide narrows again', () => {
    const { compact, panels } = onViewport();
    panels.openOverlay('primary');
    expect(panels.isOverlayOpen('primary')).toBe(true);

    compact.set(false);
    expect(panels.anyOverlayOpen()).toBe(false);
    compact.set(true);

    expect(panels.isOverlayOpen('primary')).toBe(false);
    expect(panels.anyOverlayOpen()).toBe(false);
  });

  it('stays closed when the window widened and narrowed while nothing looked at it', () => {
    const { compact, panels } = onViewport();
    panels.openOverlay('primary');

    compact.set(false);
    compact.set(true);

    expect(panels.anyOverlayOpen()).toBe(false);
  });

  it('opens again when the person asks for it after the window narrowed', () => {
    const { compact, panels } = onViewport();
    panels.openOverlay('primary');
    compact.set(false);
    compact.set(true);

    panels.openOverlay('primary');

    expect(panels.isOverlayOpen('primary')).toBe(true);
  });
});

