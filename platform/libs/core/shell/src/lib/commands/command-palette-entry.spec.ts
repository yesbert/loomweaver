import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule, translocoConfig } from '@jsverse/transloco';
import { CommandPaletteEntry } from './command-palette-entry';
import { PALETTE_COMMAND_ID } from './command-palette';
import { formatChord } from './format-chord';
import { ContributionRegistry } from '../plugin/contribution-registry';
import { BAR_CONTEXT, BarContext } from '../regions/bar/bar-context';

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: { en: { palette: { title: 'Command palette' } } },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

describe('CommandPaletteEntry', () => {
  it('shows the palette shortcut and opens the palette command on click (LWF-05)', () => {
    let opened = 0;
    TestBed.configureTestingModule({
      imports: [CommandPaletteEntry, transloco()],
    });
    TestBed.inject(ContributionRegistry).addCommand({
      id: PALETTE_COMMAND_ID,
      title: 'palette.title',
      icon: 'search',
      shortcut: 'mod+k',
      run: () => (opened += 1),
    });
    const fixture = TestBed.createComponent(CommandPaletteEntry);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('kbd')?.textContent?.trim()).toBe(
      formatChord('mod+k'),
    );

    const button = host.querySelector(
      '[data-testid="command-palette-entry"]',
    ) as HTMLButtonElement;
    button.click();
    expect(opened).toBe(1);
  });
});

describe('CommandPaletteEntry — the badge fits the bar it lands in (finding #38)', () => {
  let fixture: ComponentFixture<CommandPaletteEntry>;

  function create(context: BarContext | null): void {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: translocoConfig({
            availableLangs: ['en'],
            defaultLang: 'en',
          }),
          preloadLangs: true,
        }),
      ],
      providers: context ? [{ provide: BAR_CONTEXT, useValue: context }] : [],
    });
    fixture = TestBed.createComponent(CommandPaletteEntry);
    fixture.detectChanges();
  }

  function buttonClass(): string {
    const host = fixture.nativeElement as HTMLElement;
    return host.querySelector('button')?.className ?? '';
  }

  it('pins the shared bar-control height in a top bar, lining up with its neighbours', () => {
    create({ bar: 'top-bar', dock: 'top', slot: 'end' });
    expect(buttonClass()).toContain('lw-segmented');
  });

  it('renders like a plain bar item in a bottom bar, which takes the height of its tallest item', () => {
    create({ bar: 'status-bar', dock: 'bottom', slot: 'start' });
    expect(buttonClass()).not.toContain('lw-segmented');
  });

  it('falls back to the top-bar look when nothing says where it is', () => {
    create(null);
    expect(buttonClass()).toContain('lw-segmented');
  });
});
