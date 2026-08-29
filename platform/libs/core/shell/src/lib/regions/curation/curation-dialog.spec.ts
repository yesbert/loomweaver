import { Component, EnvironmentProviders } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { CurationDialog, CurationDialogData } from './curation-dialog';
import { DialogRef } from '../../dialog/dialog-ref';
import { LayoutRegion, provideLayout } from '../../layout/layout';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { PanelGroupService } from '../panel/panel-group.service';
import { ViewMoveService } from '../panel/view-move.service';
import { ViewVisibilityService } from '../panel/view-visibility.service';
import { View } from '../../layout/view';
import { WorkspaceService } from '../../workspace/workspace.service';
import { provideShellFeatures } from '../../foundation/shell-features';

@Component({ selector: 'lw-stub', template: '' })
class Stub {}

const left: LayoutRegion = { id: 'primary', type: 'panel', dock: 'left' };
const right: LayoutRegion = { id: 'secondary', type: 'panel', dock: 'right' };

const navView: View = {
  id: 'nav',
  region: 'primary',
  title: 'nav',
  order: 0,
  component: Stub,
};
const outlineView: View = {
  id: 'outline',
  region: 'primary',
  title: 'outline',
  order: 1,
  component: Stub,
};

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: {
      en: {
        nav: 'Nav',
        outline: 'Outline',
        dialog: { close: 'Close' },
        rail: { customize: 'Customize activity bar' },
        panel: { customizeViews: 'Customize views' },
        curation: {
          hidden: 'Hidden',
          shown: 'Shown',
          left: 'Left',
          right: 'Right',
          search: 'Search',
          empty: 'Nothing',
        },
      },
    },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

const VIEWS: CurationDialogData = { kind: 'views' };

function render(
  data: CurationDialogData = VIEWS,
  extra: EnvironmentProviders[] = [],
) {
  localStorage.clear();
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [CurationDialog, transloco()],
    providers: [
      provideRouter([]),
      provideLayout({
        regions: [
          left,
          right,
          { id: 'activity', type: 'rail', dock: 'left' },
          { id: 'main', type: 'content', dock: 'center' },
        ],
      }),
      { provide: DialogRef, useValue: new DialogRef(data) },
      ...extra,
    ],
  });
  const registry = TestBed.inject(ContributionRegistry);
  registry.addView(navView);
  registry.addView(outlineView);
  TestBed.inject(PanelGroupService).seed('primary');
  const fixture = TestBed.createComponent(CurationDialog);
  fixture.detectChanges();
  return { fixture };
}

function rows(fixture: {
  nativeElement: HTMLElement;
}): { id: string; place: string | null }[] {
  return [...fixture.nativeElement.querySelectorAll('[data-curation-row]')].map(
    (row) => ({
      id: row.getAttribute('data-curation-row') ?? '',
      place:
        row
          .querySelector('[aria-pressed="true"]')
          ?.getAttribute('data-curation-place') ?? null,
    }),
  );
}

describe('CurationDialog (K5)', () => {
  it('shows where each view sits, and hidden for one that sits nowhere', () => {
    TestBed.resetTestingModule();
    const { fixture } = render();
    TestBed.inject(ViewVisibilityService).hide('outline');
    fixture.detectChanges();

    expect(rows(fixture)).toEqual([
      { id: 'nav', place: 'primary' },
      { id: 'outline', place: 'hidden' },
    ]);
  });

  it('shows a view that sits in the other sidebar as sitting there', () => {
    const { fixture } = render();
    TestBed.inject(ViewMoveService).move('outline', 'secondary');
    fixture.detectChanges();

    expect(rows(fixture)).toContainEqual({ id: 'outline', place: 'secondary' });
  });

  it('moves a view to the other sidebar when that place is picked', () => {
    const { fixture } = render();
    const target = fixture.nativeElement.querySelector(
      '[data-curation-row="nav"] [data-curation-place="secondary"]',
    ) as HTMLButtonElement;

    target.click();
    fixture.detectChanges();

    expect(rows(fixture)).toContainEqual({ id: 'nav', place: 'secondary' });
  });

  it('hides a view when hidden is picked', () => {
    const { fixture } = render();
    const hide = fixture.nativeElement.querySelector(
      '[data-curation-row="nav"] [data-curation-place="hidden"]',
    ) as HTMLButtonElement;

    hide.click();
    fixture.detectChanges();

    expect(TestBed.inject(ViewVisibilityService).isHidden('nav')).toBe(true);
  });

  it('names the list it edits and says that Escape closes it', () => {
    const { fixture } = render({ kind: 'views' });

    expect(fixture.nativeElement.querySelector('h2')?.textContent).toContain(
      'Customize views',
    );
    expect(
      fixture.nativeElement.querySelector('[data-testid="curation-footer"]')
        ?.textContent,
    ).toContain('Esc');
  });

  it('filters the list by the search field', () => {
    const { fixture } = render();
    const search = fixture.nativeElement.querySelector(
      '[data-testid="curation-search"]',
    ) as HTMLInputElement;

    search.value = 'outl';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(rows(fixture).map((row) => row.id)).toEqual(['outline']);
  });
});

describe('CurationDialog (offering saved workspaces for the rail)', () => {
  it('offers a saved workspace a place in the rail by default', async () => {
    const { fixture } = render({ kind: 'rail' });
    await TestBed.inject(WorkspaceService).saveCurrent('Quarter close');
    fixture.detectChanges();

    expect(rows(fixture).map((row) => row.id).join(' ')).toContain(
      'shell.workspace:',
    );
  });

  it('offers none where the product decided against it', async () => {
    const { fixture } = render({ kind: 'rail' }, [
      provideShellFeatures({ workspaces: { savedInRail: false } }),
    ]);
    await TestBed.inject(WorkspaceService).saveCurrent('Quarter close');
    fixture.detectChanges();

    expect(rows(fixture).map((row) => row.id).join(' ')).not.toContain(
      'shell.workspace:',
    );
  });
});
