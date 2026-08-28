import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { PRIMARY_PANE } from '../pane/tree/pane-address';
import { CONTENT_DOCK } from '../pane/tree/pane-address';
import { PaneTreeService } from '../pane/tree/pane-tree.service';
import { PaneContainersService } from '../pane/container/pane-containers.service';
import { RetainedViewStash } from '../pane/retention/retained-view-stash';
import { SurfaceCloseGuard } from '../pane/close/surface-close-guard';
import { HiddenViewsService } from './hidden-views.service';
import { PanelGroupService } from './panel-group.service';
import { ViewVisibilityService } from './view-visibility.service';

@Component({ selector: 'lw-visibility-stub', template: '' })
class Stub {}

class GuardStub {
  candidates: readonly unknown[] = [];
  allow = true;

  guarded(candidates: readonly unknown[], proceed: () => void): void {
    this.candidates = candidates;
    if (this.allow) {
      proceed();
    }
  }
}

class StashStub {
  entries: { key: string; instance: unknown }[] = [];

  keyedInstances(): { key: string; instance: unknown }[] {
    return this.entries;
  }

  evacuate(): void {
    return;
  }
}

describe('ViewVisibilityService (hide and reveal sidebar views)', () => {
  let visibility: ViewVisibilityService;
  let paneTree: PaneTreeService;
  let containers: PaneContainersService;
  let group: PanelGroupService;
  let hidden: HiddenViewsService;
  let guard: GuardStub;
  let stash: StashStub;

  beforeEach(() => {
    localStorage.clear();
    guard = new GuardStub();
    stash = new StashStub();
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [
        { provide: SurfaceCloseGuard, useValue: guard },
        { provide: RetainedViewStash, useValue: stash },
      ],
    });
    const registry = TestBed.inject(ContributionRegistry);
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
    visibility = TestBed.inject(ViewVisibilityService);
    paneTree = TestBed.inject(PaneTreeService);
    containers = TestBed.inject(PaneContainersService);
    group = TestBed.inject(PanelGroupService);
    hidden = TestBed.inject(HiddenViewsService);
    group.seed('primary');
  });

  it('hide marks the view hidden and removes its tab from the sidebar', () => {
    visibility.hide('outline');

    expect(hidden.isHidden('outline')).toBe(true);
    expect(paneTree.primaryTabs('primary').map((tab) => tab.path)).toEqual([
      'view:nav',
    ]);
  });

  it('hide removes a stacked pane and a content-dock copy of the view', () => {
    paneTree.stackView('primary', 'outline');
    paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'view:outline');

    visibility.hide('outline');

    const primaryPaths = paneTree.primaryTabs('primary').map((tab) => tab.path);
    expect(primaryPaths).toEqual(['view:nav']);
    expect(paneTree.hasTab('view:outline')).toBe(false);
  });

  it('hide never touches a sealed container dock', () => {
    containers.ensureContainer('container@runs/1', {
      children: ['outline'],
      initial: ['outline'],
    });

    visibility.hide('outline');

    expect(
      paneTree.primaryTabs('container@runs/1').map((tab) => tab.path),
    ).toEqual(['view:outline']);
  });

  it('hide hands the view’s retained instances to the close guard and stops on cancel', () => {
    const dirty = { marker: 'dirty' };
    stash.entries = [
      { key: 'primary:main|view:outline|outline', instance: dirty },
      { key: 'container@runs/1:main|view:outline|c', instance: 'sealed' },
      { key: 'primary:main|view:nav|nav', instance: 'other' },
    ];
    guard.allow = false;

    visibility.hide('outline');

    expect(guard.candidates).toEqual([dirty]);
    expect(hidden.isHidden('outline')).toBe(false);
    expect(paneTree.primaryTabs('primary')).toHaveLength(2);
  });

  it('reveal seeds the view back at its declared position without stealing the selection', () => {
    visibility.hide('nav');
    expect(paneTree.primaryTabs('primary').map((tab) => tab.path)).toEqual([
      'view:outline',
    ]);

    visibility.reveal('nav');

    expect(paneTree.primaryTabs('primary').map((tab) => tab.path)).toEqual([
      'view:nav',
      'view:outline',
    ]);
    expect(group.activePath('primary')).toBe('view:outline');
  });

  it('reveal into a named region puts the view there, not at its declared position', () => {
    visibility.hide('outline');

    visibility.reveal('outline', 'secondary');

    expect(hidden.isHidden('outline')).toBe(false);
    expect(paneTree.primaryTabs('primary').map((tab) => tab.path)).toEqual([
      'view:nav',
    ]);
    expect(paneTree.primaryTabs('secondary').map((tab) => tab.path)).toEqual([
      'view:outline',
    ]);
  });

  it('toggle in a region hides what sits there and pulls in what does not', () => {
    visibility.toggle('outline', 'secondary');

    expect(hidden.isHidden('outline')).toBe(false);
    expect(paneTree.primaryTabs('secondary').map((tab) => tab.path)).toEqual([
      'view:outline',
    ]);

    visibility.toggle('outline', 'secondary');

    expect(hidden.isHidden('outline')).toBe(true);
    expect(paneTree.hasTab('view:outline')).toBe(false);
  });

  it('toggle hides a visible view and reveals a hidden one', () => {
    visibility.toggle('outline');
    expect(hidden.isHidden('outline')).toBe(true);

    visibility.toggle('outline');
    expect(hidden.isHidden('outline')).toBe(false);
    expect(paneTree.primaryTabs('primary').map((tab) => tab.path)).toEqual([
      'view:nav',
      'view:outline',
    ]);
  });
});
