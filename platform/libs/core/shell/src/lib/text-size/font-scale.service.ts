import { DOCUMENT } from '@angular/common';
import { effect, inject, Service, signal } from '@angular/core';
import { SETTINGS_STORE } from '../persistence/settings-store';
import { hydrateAsync } from '../persistence/hydrate';
import { StateSyncService } from '../persistence/state-sync.service';

export type FontScale = 'sm' | 'md' | 'lg' | 'xl';

const STORAGE_KEY = 'lw.shell.font-scale';
const SCALES: ReadonlySet<FontScale> = new Set(['sm', 'md', 'lg', 'xl']);
const ROOT_SIZE: Record<Exclude<FontScale, 'md'>, string> = {
  sm: '90%',
  lg: '112.5%',
  xl: '125%',
};

function sanitizeScale(raw: string | undefined): FontScale {
  return SCALES.has(raw as FontScale) ? (raw as FontScale) : 'md';
}

@Service()
export class FontScaleService {
  private readonly document = inject(DOCUMENT);
  private readonly store = inject(SETTINGS_STORE);
  private readonly sync = inject(StateSyncService);

  private readonly scaleState = signal<FontScale>(
    sanitizeScale(this.store.peek?.(STORAGE_KEY)),
  );

  readonly scale = this.scaleState.asReadonly();

  constructor() {
    hydrateAsync(this.store, STORAGE_KEY, (raw) =>
      this.scaleState.set(sanitizeScale(raw)),
    );
    this.sync.register('settings', STORAGE_KEY, (raw) =>
      this.scaleState.set(sanitizeScale(raw)),
    );
    effect(() => {
      const scale = this.scale();
      const root = this.document.documentElement.style;
      if (scale === 'md') {
        root.removeProperty('font-size');
        return;
      }
      root.fontSize = ROOT_SIZE[scale];
    });
  }

  setScale(scale: FontScale): void {
    this.scaleState.set(scale);
    void this.store.set(STORAGE_KEY, scale);
  }
}
