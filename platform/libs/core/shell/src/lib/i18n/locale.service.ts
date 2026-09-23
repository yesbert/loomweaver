import { DOCUMENT } from '@angular/common';
import { inject, isDevMode, Service, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';
import {
  catchError,
  defaultIfEmpty,
  map,
  of,
  Subscription,
  take,
  timeout,
} from 'rxjs';
import { SETTINGS_STORE } from '../persistence/settings-store';
import { hydrateAsync } from '../persistence/hydrate';
import { StateSyncService } from '../persistence/state-sync.service';
import {
  LANGUAGE_STORAGE_KEY,
  languageName,
  SERVED_LANGUAGES,
  servedLanguage,
} from './served-languages';
import { holdsStrings } from './missing-translation-handler';

const LANGUAGE_LOAD_BOUND_MS = 10_000;

/** One language the workbench serves: its canonical code and its name, written in that language. */
export interface ServedLanguage {
  readonly code: string;
  readonly name: string;
}

/**
 * The workbench's language, for a product's own language control. It is the same mechanism the
 * shipped switcher uses, so a control a distribution registers in place of `shell.language`, in any
 * bar or as a settings row, changes the language exactly as the switcher does: once the language's
 * strings have loaded, it is re-rendered, declared on `<html lang>`, remembered through the settings
 * port and followed by the application's other windows and isolated surfaces, all in the same step.
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

  private readonly langState = signal<string>(this.transloco.getActiveLang());

  private pendingLoad?: Subscription;

  private choice: 'none' | 'pending' | 'made' = 'none';

  private heldBack?: string;

  /** The active language code, reactive. */
  readonly lang = this.langState.asReadonly();

  constructor() {
    this.transloco.langChanges$
      .pipe(takeUntilDestroyed())
      .subscribe((active) => this.follow(active));
    hydrateAsync(this.store, LANGUAGE_STORAGE_KEY, (raw) =>
      this.applyStored(raw),
    );
    this.sync.register('settings', LANGUAGE_STORAGE_KEY, (raw) =>
      this.applySynced(raw),
    );
  }

  /**
   * Makes `lang` the active language and remembers it. A language whose strings have not arrived yet
   * becomes active, and is remembered, once they have, so the interface never shows keys in between
   * and {@link lang} changes then rather than at the call. A language whose strings cannot be loaded,
   * or do not arrive within ten seconds, is not switched to and not remembered, so it can be chosen
   * again. {@link lang} always names the language the interface is shown in, including one the
   * translation library falls back to on its own. A code the workbench does not serve changes
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
    const before = this.choice;
    this.choice = 'pending';
    this.applyLang(served, {
      switched: () => {
        this.choice = 'made';
        this.heldBack = undefined;
        void this.store.set(LANGUAGE_STORAGE_KEY, served);
      },
      failed: () => {
        this.choice = before === 'made' ? 'made' : 'none';
        const held = this.heldBack;
        this.heldBack = undefined;
        this.applyStored(held);
      },
    });
  }

  private applyStored(raw: string | null | undefined): void {
    if (this.choice === 'pending') {
      this.heldBack = raw ?? undefined;
    } else if (this.choice === 'none') {
      this.applySynced(raw);
    }
  }

  private applySynced(raw: string | null | undefined): void {
    const lang = servedLanguage(raw, this.supported);
    if (lang === undefined) {
      return;
    }
    if (this.choice === 'pending') {
      this.choice = 'made';
      this.heldBack = undefined;
    }
    if (lang === this.langState()) {
      this.pendingLoad?.unsubscribe();
      return;
    }
    this.applyLang(lang);
  }

  private applyLang(
    lang: string,
    outcome?: { readonly switched: () => void; readonly failed: () => void },
  ): void {
    const load = new Subscription();
    this.pendingLoad?.unsubscribe();
    this.pendingLoad = load;
    load.add(
      this.transloco
        .load(lang)
        .pipe(
          take(1),
          map(() => holdsStrings(this.transloco, lang)),
          defaultIfEmpty(false),
          timeout({ first: LANGUAGE_LOAD_BOUND_MS, with: () => of(false) }),
          catchError(() => of(false)),
        )
        .subscribe((loaded) => {
          if (loaded) {
            this.transloco.setActiveLang(lang);
            outcome?.switched();
            return;
          }
          if (isDevMode()) {
            console.warn(
              `LocaleService: the strings for "${lang}" could not be loaded, so the workbench stays in "${this.langState()}".`,
            );
          }
          outcome?.failed();
        }),
    );
  }

  private follow(active: string): void {
    this.langState.set(active);
    this.document.documentElement.lang = active;
  }
}
