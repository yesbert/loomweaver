import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Service, signal, Signal } from '@angular/core';
import { SETTINGS_STORE } from '../persistence/settings-store';
import { hydrateAsync } from '../persistence/hydrate';
import { StateSyncService } from '../persistence/state-sync.service';

/** What the user picked. `system` follows the OS `prefers-color-scheme`. */
export type ThemeMode = 'light' | 'dark' | 'system';

/** What is actually being rendered, once `system` has been resolved against the OS. */
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'lw.shell.theme';
const MODES: ReadonlySet<ThemeMode> = new Set(['light', 'dark', 'system']);

function sanitizeMode(raw: string | undefined): ThemeMode {
  return MODES.has(raw as ThemeMode) ? (raw as ThemeMode) : 'system';
}

/**
 * Owns light/dark for the whole application: it persists the user's choice through the
 * the settings store, mirrors it across tabs, and toggles the `dark` class on `<html>` — which is what
 * flips the `--lw-*` token ladder every surface reads.
 *
 * Inject it when your own UI has to follow the same mode, most commonly to mirror it onto another
 * framework's switch (Bootstrap's `data-bs-theme`, for example) so the two never disagree:
 *
 * ```ts
 * const theme = inject(ThemeService);
 * effect(() => {
 *   document.documentElement.setAttribute('data-bs-theme', theme.resolvedTheme());
 * });
 * ```
 */
@Service()
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly store = inject(SETTINGS_STORE);
  private readonly sync = inject(StateSyncService);
  private readonly systemDark = this.watchSystemPreference();

  private readonly modeState = signal<ThemeMode>(
    sanitizeMode(this.store.peek?.(STORAGE_KEY)),
  );

  /** The user's choice, including `system`. Use {@link resolvedTheme} to know what is rendered. */
  readonly mode = this.modeState.asReadonly();

  /** The mode in effect, with `system` already resolved against the OS preference. */
  readonly resolvedTheme: Signal<ResolvedTheme> = computed(() => {
    const mode = this.mode();
    return mode === 'dark' || (mode === 'system' && this.systemDark())
      ? 'dark'
      : 'light';
  });

  constructor() {
    hydrateAsync(this.store, STORAGE_KEY, (raw) =>
      this.modeState.set(sanitizeMode(raw)),
    );
    this.sync.register('settings', STORAGE_KEY, (raw) =>
      this.modeState.set(sanitizeMode(raw)),
    );
    effect(() => {
      this.document.documentElement.classList.toggle(
        'dark',
        this.resolvedTheme() === 'dark',
      );
    });
  }

  /** Switch the mode and persist it. Other tabs follow through the settings sync. */
  setMode(mode: ThemeMode): void {
    this.modeState.set(mode);
    void this.store.set(STORAGE_KEY, mode);
  }

  private watchSystemPreference() {
    const query = this.document.defaultView?.matchMedia?.(
      '(prefers-color-scheme: dark)',
    );
    const dark = signal(query?.matches ?? false);
    query?.addEventListener('change', (event) => dark.set(event.matches));
    return dark;
  }
}
