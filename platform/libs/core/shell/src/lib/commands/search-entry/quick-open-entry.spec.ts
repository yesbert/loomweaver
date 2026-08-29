import { TestBed } from '@angular/core/testing';
import {
  EnvironmentInjector,
  EnvironmentProviders,
  createEnvironmentInjector,
  inject,
  runInInjectionContext,
} from '@angular/core';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { BarItem } from '@loomweaver/plugin-sdk';
import { QuickOpenEntry } from './quick-open-entry';
import { QUICK_OPEN_COMMAND_ID, PALETTE_COMMAND_ID } from '../command-palette';
import { formatChord } from '../format-chord';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { BAR_ITEM } from '../../foundation/bar-item';
import { provideCommandPaletteEntry } from './provide-command-palette-entry';
import { provideQuickOpenEntry } from './provide-quick-open-entry';

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: { en: { palette: { quickOpenTitle: 'Go to open tab…' } } },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

function barItems(...providers: EnvironmentProviders[]): readonly BarItem[] {
  const injector = createEnvironmentInjector(
    providers,
    TestBed.inject(EnvironmentInjector),
  );
  return runInInjectionContext(injector, () => inject(BAR_ITEM));
}

describe('QuickOpenEntry', () => {
  it('opens the search over open work, and not the command search', () => {
    const opened: string[] = [];
    TestBed.configureTestingModule({
      imports: [QuickOpenEntry, transloco()],
    });
    const registry = TestBed.inject(ContributionRegistry);
    registry.addCommand({
      id: PALETTE_COMMAND_ID,
      title: 'palette.title',
      icon: 'search',
      shortcut: 'mod+k',
      run: () => void opened.push(PALETTE_COMMAND_ID),
    });
    registry.addCommand({
      id: QUICK_OPEN_COMMAND_ID,
      title: 'palette.quickOpenTitle',
      icon: 'openWork',
      shortcut: 'mod+p',
      run: () => void opened.push(QUICK_OPEN_COMMAND_ID),
    });
    const fixture = TestBed.createComponent(QuickOpenEntry);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('kbd')?.textContent?.trim()).toBe(
      formatChord('mod+p'),
    );

    (
      host.querySelector('[data-testid="quick-open-entry"]') as HTMLButtonElement
    ).click();
    expect(opened).toEqual([QUICK_OPEN_COMMAND_ID]);
  });
});

describe('The two search entries are placed independently', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('lands in the status bar by default, apart from the command-palette entry', () => {
    const items = barItems(provideCommandPaletteEntry(), provideQuickOpenEntry());
    const placement = items.map((item) => [item.id, item.bar, item.slot]);

    expect(placement).toEqual([
      ['shell.commandPaletteEntry', 'top-bar', 'end'],
      ['shell.quickOpenEntry', 'status-bar', 'start'],
    ]);
  });

  it('shows only the placed one where a distribution places one and not the other', () => {
    expect(barItems(provideQuickOpenEntry()).map((item) => item.id)).toEqual([
      'shell.quickOpenEntry',
    ]);
    expect(
      barItems(provideCommandPaletteEntry()).map((item) => item.id),
    ).toEqual(['shell.commandPaletteEntry']);
  });
});
