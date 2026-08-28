import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ShellSidebarHeader } from './shell-sidebar-header';
import { LayoutRegion, provideLayout } from '../../layout/layout';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { PanelState } from './panel-state';
import { PanelGroupService } from './panel-group.service';
import { View } from '../../layout/view';

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
