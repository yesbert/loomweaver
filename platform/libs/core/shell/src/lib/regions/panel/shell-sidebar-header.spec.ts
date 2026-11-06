import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ShellSidebarHeader } from './shell-sidebar-header';
import { LayoutRegion, provideLayout } from '../../layout/layout';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { PanelState } from './panel-state';
import { PanelGroupService } from './panel-group.service';
import { View } from '../../views/view';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { PaneTreeService } from '../pane/tree/pane-tree.service';
import { FeatureSwitches } from '../../features/feature-switches.service';
import { DialogService } from '../../dialog/dialog.service';
import { UnsavedWork } from '../pane/unsaved-work/unsaved-work';

@Component({ selector: 'lw-stub', template: '' })
class Stub {}

const panelRegion: LayoutRegion = {
  id: 'primary',
  type: 'panel',
  dock: 'left',
};
const navView: View = {
  id: 'nav',
  region: 'primary',
  title: 'nav',
  icon: 'navigator',
  order: 0,
  component: Stub,
};
const outlineView: View = {
  id: 'outline',
  region: 'primary',
  title: 'outline',
  icon: 'outline',
  order: 1,
  component: Stub,
};

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: {
      en: {
        nav: 'Nav',
        outline: 'Outline',
        panel: { collapse: 'Collapse', expand: 'Expand' },
      },
    },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

function render() {
  localStorage.clear();
  TestBed.configureTestingModule({
    imports: [ShellSidebarHeader, transloco()],
    providers: [
      provideRouter([]),
      provideLayout({
        regions: [
          panelRegion,
          { id: 'secondary', type: 'panel', dock: 'right' },
          { id: 'main', type: 'content', dock: 'center' },
        ],
      }),
    ],
  });
  const registry = TestBed.inject(ContributionRegistry);
  registry.addView(navView);
  registry.addView(outlineView);
  const panels = TestBed.inject(PanelState);
  const group = TestBed.inject(PanelGroupService);
  group.seed('primary');
  const fixture = TestBed.createComponent(ShellSidebarHeader);
  fixture.componentRef.setInput('region', panelRegion);
  fixture.detectChanges();
  return { fixture, panels, group };
}

describe('ShellSidebarHeader (the primary tab group as icon strip)', () => {
  it('renders an icon tab per seeded view and switches the group active tab', () => {
    const { fixture, group } = render();

    const tabs = fixture.nativeElement.querySelectorAll(
      '[role="tab"]',
    ) as NodeListOf<HTMLButtonElement>;
    expect(tabs.length).toBe(2);
    expect(tabs[1].getAttribute('aria-label')).toBe('Outline');
    expect(group.activePath('primary')).toBe('view:nav');

    tabs[1].click();
    expect(group.activePath('primary')).toBe('view:outline');
  });

  it('a collapsed edge header renders nothing (its column disappears, content reaches the rail)', () => {
    const { fixture, panels } = render();

    (
      fixture.nativeElement.querySelector(
        '[aria-label="Collapse"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(panels.isCollapsed('primary')).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('[role="tab"]').length).toBe(
      0,
    );
    expect(
      fixture.nativeElement.querySelector('[aria-label="Expand"]'),
    ).toBeNull();
  });

  it('floating context shows the expand control (top-band button of a collapsed rail-less sidebar)', () => {
    const { fixture, panels } = render();
    panels.toggle('primary');
    fixture.componentRef.setInput('context', 'floating');
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[aria-label="Expand"]'),
    ).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('[role="tab"]').length).toBe(
      0,
    );
  });
});

describe('ShellSidebarHeader moving a view with the keyboard', () => {
  it('announces the view it moved to the other sidebar, as the context menu does', async () => {
    const { fixture } = render();
    const announce = vi
      .spyOn(TestBed.inject(LiveAnnouncer), 'announce')
      .mockResolvedValue();
    const tab = fixture.nativeElement.querySelector(
      '[data-tab-path="view:nav"]',
    ) as HTMLElement;

    tab.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        altKey: true,
        shiftKey: true,
        bubbles: true,
      }),
    );

    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    expect(TestBed.inject(PaneTreeService).sourceOf('view:nav')?.dock).toBe(
      'secondary',
    );
    expect(announce).toHaveBeenCalledTimes(1);
  });

  function moveRight(fixture: { nativeElement: HTMLElement }, path: string) {
    fixture.nativeElement
      .querySelector(`[data-tab-path="${CSS.escape(path)}"]`)
      ?.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowRight',
          altKey: true,
          shiftKey: true,
          bubbles: true,
        }),
      );
  }

  function renderWithParkedTab() {
    const { fixture } = render();
    const paneTree = TestBed.inject(PaneTreeService);
    paneTree.insertTab('primary', paneTree.primaryId('primary'), 'doc/a');
    fixture.detectChanges();
    vi.spyOn(TestBed.inject(LiveAnnouncer), 'announce').mockResolvedValue();
    return { fixture, paneTree };
  }

  it('leaves a parked tab where it is while parking a tab in a sidebar is switched off', () => {
    const { fixture, paneTree } = renderWithParkedTab();
    TestBed.inject(FeatureSwitches).update({ sidebar: { acceptTabs: false } });

    moveRight(fixture, 'doc/a');

    expect(paneTree.sourceOf('doc/a')?.dock).toBe('primary');
  });

  it('moves a parked tab to the other sidebar although moving a view is switched off', () => {
    const { fixture, paneTree } = renderWithParkedTab();
    TestBed.inject(FeatureSwitches).update({ sidebar: { moveViews: false } });

    moveRight(fixture, 'doc/a');

    expect(paneTree.sourceOf('doc/a')?.dock).toBe('secondary');
  });

  it('focuses the moved view in the other sidebar once the question about it was answered', async () => {
    const { fixture } = render();
    const other = TestBed.createComponent(ShellSidebarHeader);
    other.componentRef.setInput('region', {
      id: 'secondary',
      type: 'panel',
      dock: 'right',
    });
    vi.spyOn(TestBed.inject(LiveAnnouncer), 'announce').mockResolvedValue();
    vi.spyOn(TestBed.inject(UnsavedWork), 'lostBy').mockReturnValue([
      { surfaceDirty: () => true },
    ]);

    moveRight(fixture, 'view:nav');
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    TestBed.tick();
    TestBed.inject(DialogService).dialogs().at(-1)?.ref.close('discard');
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    TestBed.tick();

    expect(document.activeElement?.closest('#panel-views-secondary')).not.toBe(
      null,
    );
    expect(
      (document.activeElement as HTMLElement | null)?.dataset['tabPath'],
    ).toBe('view:nav');
  });

  it('leaves a view where it is while moving a view is switched off', () => {
    const { fixture, paneTree } = renderWithParkedTab();
    TestBed.inject(FeatureSwitches).update({ sidebar: { moveViews: false } });

    moveRight(fixture, 'view:nav');

    expect(paneTree.sourceOf('view:nav')?.dock).toBe('primary');
  });
});
