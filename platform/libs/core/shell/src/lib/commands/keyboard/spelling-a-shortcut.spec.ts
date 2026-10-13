import { computed } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoService, TranslocoTestingModule } from '@jsverse/transloco';
import {
  defineLwMenu,
  LW_MENU_ITEM_TAG,
} from '../../elements/menu/lw-menu.element';
import de from '../../i18n/de.json';
import en from '../../i18n/en.json';
import { MenuService } from '../../menu/menu.service';
import { wordChordKeys } from './chord-wording';
import { formatChord } from './format-chord';

const original = Object.getOwnPropertyDescriptor(navigator, 'platform');

function onPlatform(value: string): void {
  Object.defineProperty(navigator, 'platform', { value, configurable: true });
}

function withTheShellsWords(): void {
  TestBed.configureTestingModule({
    imports: [
      TranslocoTestingModule.forRoot({
        langs: { en, de },
        translocoConfig: { availableLangs: ['en', 'de'], defaultLang: 'en' },
        preloadLangs: true,
      }),
    ],
  });
  TestBed.runInInjectionContext(wordChordKeys);
}

function speak(language: string): void {
  TestBed.inject(TranslocoService).setActiveLang(language);
}

describe('spelling a shortcut', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    if (original) {
      Object.defineProperty(navigator, 'platform', original);
    }
  });

  it('names keys in the interface language where the platform uses words', () => {
    onPlatform('Win32');
    withTheShellsWords();

    expect(formatChord('mod+shift+delete')).toBe('Ctrl+Shift+Del');
    speak('de');
    expect(formatChord('mod+shift+delete')).toBe('Strg+Umschalt+Entf');
    expect(formatChord('home')).toBe('Pos1');
    expect(formatChord('pagedown')).toBe('Bild↓');
  });

  it("shows the platform's symbols on macOS, whatever the language", () => {
    onPlatform('MacIntel');
    withTheShellsWords();
    speak('de');

    expect(formatChord('mod+delete')).toBe('⌘⌦');
    expect(formatChord('backspace')).toBe('⌫');
    expect(formatChord('shift+tab')).toBe('⇧⇥');
    expect(formatChord('space')).toBe('Leertaste');
  });

  it("spells the neutral delete key as the platform's delete key", () => {
    withTheShellsWords();
    speak('de');

    onPlatform('MacIntel');
    expect(formatChord('mod+del')).toBe('⌘⌫');
    onPlatform('Win32');
    expect(formatChord('mod+del')).toBe('Strg+Entf');
  });

  it('falls back to the English words without a running shell', () => {
    onPlatform('Win32');

    expect(formatChord('mod+delete')).toBe('Ctrl+Del');
  });

  it('spells a hint again when the language changes', () => {
    onPlatform('Win32');
    withTheShellsWords();
    const hint = computed(() => formatChord('mod+delete'));

    expect(hint()).toBe('Ctrl+Del');
    speak('de');
    expect(hint()).toBe('Strg+Entf');
  });

  it("re-spells an open menu's hints with its labels", () => {
    onPlatform('Win32');
    defineLwMenu();
    withTheShellsWords();
    const menu = TestBed.inject(MenuService);
    onTestFinished(() => menu.close());

    menu.openList(
      [{ key: 'remove', label: 'Remove', chord: 'delete' }],
      { x: 0, y: 0 },
      () => undefined,
    );
    const hint = () =>
      document.body.querySelector(LW_MENU_ITEM_TAG)?.getAttribute('shortcut');

    expect(hint()).toBe('Del');
    speak('de');
    expect(hint()).toBe('Entf');
  });
});
