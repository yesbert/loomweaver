import { DOCUMENT } from '@angular/common';
import { effect, inject, Service } from '@angular/core';
import { persistedSetting } from '../persistence/persisted-setting';

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

  private readonly stored = persistedSetting<FontScale>(STORAGE_KEY, {
    parse: sanitizeScale,
    serialize: (scale) => scale,
  });

  readonly scale = this.stored.value;

  constructor() {
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
    this.stored.set(scale);
  }
}
