import { DOCUMENT } from '@angular/common';
import { inject, isDevMode, Service, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { SETTINGS_STORE } from '../persistence/settings-store';
import { hydrateAsync } from '../persistence/hydrate';
import { StateSyncService } from '../persistence/state-sync.service';
import {
  detectInitialLang,
  LANGUAGE_STORAGE_KEY,
  languageName,
  SERVED_LANGUAGES,
  servedLanguage,
} from './served-languages';

/** One language the workbench serves: its canonical code and its name, written in that language. */
export interface ServedLanguage {
  readonly code: string;
  readonly name: string;
}

/**
 * The workbench's language, for a product's own language control. It is the same mechanism the
 * shipped switcher uses, so a control a distribution registers in place of `shell.language`, in any
 * bar or as a settings row, changes the language exactly as the switcher does: re-rendered at once,
 * declared on `<html lang>`, remembered through the settings port and followed by the application's
 * other windows and isolated surfaces.
 *
 * The served set is what the distribution declared with `provideShell({ languages })`, or English and
 * German when it declared nothing.
 */
@Service()
export class LocaleService {
  private readonly transloco = inject(TranslocoService);
  private readonly document = inject(DOCUMENT);
  private readonly store = inject(SETTINGS_STORE);
  private readonly sync = inject(StateSyncService);

  /** The codes of the served languages, in the order the distribution declared them. */
  readonly supported = inject(SERVED_LANGUAGES);

  /**
   * The served languages with the name of each in its own language ("Deutsch", "Français"), the same
   * names the shipped switcher shows. A code the platform cannot name is shown as the code.
   */
  readonly languages: readonly ServedLanguage[] = this.supported.map((code) => ({
    code,
    name: languageName(code),
  }));

  private readonly langState = signal<string>(detectInitialLang(this.supported));

  /** The active language code, reactive. */
  readonly lang = this.langState.asReadonly();

  constructor() {
    this.document.documentElement.lang = this.lang();
    hydrateAsync(this.store, LANGUAGE_STORAGE_KEY, (raw) =>
      this.applyServed(raw),
    );
    this.sync.register('settings', LANGUAGE_STORAGE_KEY, (raw) =>
      this.applyServed(raw),
    );
  }

  /**
   * Makes `lang` the active language and remembers it. A code the workbench does not serve changes
   * nothing, and the developer is told in development, rather than silently doing nothing.
   */
  setLang(lang: string): void {
    const served = servedLanguage(lang, this.supported);
    if (served === undefined) {
      if (isDevMode()) {
        console.warn(
          `LocaleService.setLang("${lang}") changed nothing: the workbench serves ${this.supported.join(', ')}.`,
        );
      }
      return;
    }
    this.applyLang(served);
    void this.store.set(LANGUAGE_STORAGE_KEY, served);
  }

  private applyServed(raw: string | null | undefined): void {
    const lang = servedLanguage(raw, this.supported);
    if (lang !== undefined) {
      this.applyLang(lang);
    }
  }

  private applyLang(lang: string): void {
    this.langState.set(lang);
    this.transloco.setActiveLang(lang);
    this.document.documentElement.lang = lang;
  }
}
