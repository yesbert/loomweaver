import { DOCUMENT } from '@angular/common';
import { inject, Service, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { SETTINGS_STORE } from '../persistence/settings-store';
import { hydrateAsync } from '../persistence/hydrate';
import { StateSyncService } from '../persistence/state-sync.service';

export const SUPPORTED_LANGS = ['en', 'de'] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

const STORAGE_KEY = 'lw.shell.lang';

function isSupported(value: string | null | undefined): value is SupportedLang {
  return (
    value != null && (SUPPORTED_LANGS as readonly string[]).includes(value)
  );
}

function storedLang(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function detectInitialLang(): SupportedLang {
  const stored = storedLang();
  if (isSupported(stored)) {
    return stored;
  }
  for (const candidate of navigator.languages ?? [navigator.language]) {
    const base = candidate?.slice(0, 2).toLowerCase();
    if (isSupported(base)) {
      return base;
    }
  }
  return 'en';
}

@Service()
export class LocaleService {
  private readonly transloco = inject(TranslocoService);
  private readonly document = inject(DOCUMENT);
  private readonly store = inject(SETTINGS_STORE);
  private readonly sync = inject(StateSyncService);

  private readonly langState = signal<SupportedLang>(detectInitialLang());

  readonly lang = this.langState.asReadonly();
  readonly supported = SUPPORTED_LANGS;

  constructor() {
    this.document.documentElement.lang = this.lang();
    hydrateAsync(this.store, STORAGE_KEY, (raw) => {
      if (isSupported(raw)) {
        this.applyLang(raw);
      }
    });
    this.sync.register('settings', STORAGE_KEY, (raw) => {
      if (isSupported(raw)) {
        this.applyLang(raw);
      }
    });
  }

  setLang(lang: SupportedLang): void {
    this.applyLang(lang);
    void this.store.set(STORAGE_KEY, lang);
  }

  private applyLang(lang: SupportedLang): void {
    this.langState.set(lang);
    this.transloco.setActiveLang(lang);
    this.document.documentElement.lang = lang;
  }
}
