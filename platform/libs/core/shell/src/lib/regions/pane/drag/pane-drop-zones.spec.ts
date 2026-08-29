import { TestBed } from '@angular/core/testing';
import { PaneDragService } from './pane-drag.service';
import { PaneDropZones } from './pane-drop-zones';
import { CONTENT_DOCK } from '../tree/pane-address';
import { PaneTreeService } from '../tree/pane-tree.service';
import { PRIMARY_PANE } from '../tree/pane-address';
import { provideShellFeatures, ShellFeaturesInput } from '../../../foundation/shell-features';

function mount() {
  const fixture = TestBed.createComponent(PaneDropZones);
  fixture.componentRef.setInput('dock', CONTENT_DOCK);
  fixture.componentRef.setInput('paneId', PRIMARY_PANE);
  fixture.detectChanges();
  return fixture;
}

function contentZoneIds(): readonly string[] {
  return TestBed.inject(PaneDragService)
    .dropTargetIds()
    .filter((id) =>
      id.startsWith(`pane-zone:${CONTENT_DOCK}:${PRIMARY_PANE}:`),
    );
}

function sidebarZoneCount(features: ShellFeaturesInput): number {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [provideShellFeatures(features)],
  });
  TestBed.inject(PaneTreeService).seedPrimaryTabs('primary', ['view:outline']);
  const fixture = TestBed.createComponent(PaneDropZones);
  fixture.componentRef.setInput('dock', 'primary');
  fixture.componentRef.setInput('paneId', PRIMARY_PANE);
  fixture.detectChanges();
  return fixture.nativeElement.querySelectorAll('.lw-pane-drop-zone').length;
}

describe('PaneDropZones', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('offers one whole-pane zone while the pane holds no tabs', () => {
    const fixture = mount();

    expect(contentZoneIds()).toEqual([
      `pane-zone:${CONTENT_DOCK}:${PRIMARY_PANE}:fill`,
    ]);
    expect(
      fixture.nativeElement.querySelectorAll('.lw-pane-drop-zone').length,
    ).toBe(1);
    expect(
      fixture.nativeElement.querySelector('.lw-pane-drop-preview--fill'),
    ).not.toBeNull();
  });

  it('offers the four edge zones again once the pane holds a tab', () => {
    const fixture = mount();
    TestBed.inject(PaneTreeService).seedPrimaryTabs(CONTENT_DOCK, [
      'view:outline',
    ]);
    fixture.detectChanges();

    expect([...contentZoneIds()].toSorted()).toEqual([
      `pane-zone:${CONTENT_DOCK}:${PRIMARY_PANE}:bottom`,
      `pane-zone:${CONTENT_DOCK}:${PRIMARY_PANE}:left`,
      `pane-zone:${CONTENT_DOCK}:${PRIMARY_PANE}:right`,
      `pane-zone:${CONTENT_DOCK}:${PRIMARY_PANE}:top`,
    ]);
    expect(
      fixture.nativeElement.querySelectorAll('.lw-pane-drop-zone').length,
    ).toBe(4);
  });

  it('offers the four edges of a sidebar while stacking or parking is allowed', () => {
    expect(sidebarZoneCount({})).toBe(4);
    expect(sidebarZoneCount({ sidebar: { stackViews: false } })).toBe(4);
    expect(sidebarZoneCount({ sidebar: { acceptTabs: false } })).toBe(4);
  });

  it('offers no sidebar edges once neither is allowed', () => {
    expect(
      sidebarZoneCount({
        sidebar: { stackViews: false, acceptTabs: false },
      }),
    ).toBe(0);
  });
});
