import { TestBed } from '@angular/core/testing';
import { WritableSignal, signal } from '@angular/core';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ANONYMOUS, AuthSnapshot } from '@loomweaver/plugin-sdk';
import { CommandPaletteEntry } from './command-palette-entry';
import { PALETTE_COMMAND_ID } from '../command-palette';
import { ContributionRegistry } from '../../../contributions/contribution-registry';
import { AUTH_SOURCE } from '../../../auth/auth-context';
import { provideShellFeatures } from '../../../foundation/shell-features';
import { formatChord } from '../../keyboard/format-chord';
import { ariaKeyShortcuts } from '../../keyboard/chord';

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: { en: { palette: { title: 'Command palette' } } },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

describe('SearchEntry — the badge does not outlive the search it opens', () => {
  it('renders nothing when the distribution has omitted the command', () => {
    TestBed.configureTestingModule({
      imports: [CommandPaletteEntry, transloco()],
    });
    const registry = TestBed.inject(ContributionRegistry);
    registry.addCommand({
      id: PALETTE_COMMAND_ID,
      title: 'palette.title',
      icon: 'search',
      shortcut: 'mod+k',
      run: () => undefined,
    });
    registry.omit([PALETTE_COMMAND_ID]);
    const fixture = TestBed.createComponent(CommandPaletteEntry);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('button')).toBeNull();
  });

  it('shows no badge to a session that may not run the command, and one once it qualifies', () => {
    const auth: WritableSignal<AuthSnapshot> = signal(ANONYMOUS);
    TestBed.configureTestingModule({
      imports: [CommandPaletteEntry, transloco()],
      providers: [{ provide: AUTH_SOURCE, useValue: auth }],
    });
    TestBed.inject(ContributionRegistry).addCommand({
      id: PALETTE_COMMAND_ID,
      title: 'palette.title',
      icon: 'search',
      shortcut: 'mod+k',
      access: { anyRole: ['admin'] },
      run: () => undefined,
    });
    const fixture = TestBed.createComponent(CommandPaletteEntry);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('button')).toBeNull();

    auth.set({ authenticated: true, roles: ['admin'], claims: {} });
    fixture.detectChanges();
    expect(host.querySelector('button')).not.toBeNull();
  });

  it('names the entry by its purpose followed by the shortcut it shows', () => {
    TestBed.configureTestingModule({
      imports: [CommandPaletteEntry, transloco()],
    });
    TestBed.inject(ContributionRegistry).addCommand({
      id: PALETTE_COMMAND_ID,
      title: 'palette.title',
      icon: 'search',
      shortcut: 'mod+k',
      run: () => undefined,
    });
    const fixture = TestBed.createComponent(CommandPaletteEntry);
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector(
      'button',
    ) as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe(
      `Command palette ${formatChord('mod+k')}`,
    );
    expect(button.getAttribute('aria-keyshortcuts')).toBe(
      ariaKeyShortcuts('mod+k'),
    );
  });

  it('stays and still opens the search where shortcuts are off, promising no chord', () => {
    let opened = 0;
    TestBed.configureTestingModule({
      imports: [CommandPaletteEntry, transloco()],
      providers: [provideShellFeatures({ commands: { shortcuts: false } })],
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
    const button = host.querySelector('button') as HTMLButtonElement;
    expect(button).not.toBeNull();
    expect(host.querySelector('kbd')).toBeNull();
    expect(button.getAttribute('aria-label')).toBe('Command palette');
    expect(button.hasAttribute('aria-keyshortcuts')).toBe(false);

    button.click();
    expect(opened).toBe(1);
  });
});
