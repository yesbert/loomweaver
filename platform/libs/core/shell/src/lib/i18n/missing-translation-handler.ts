import { Injectable, Injector, inject, isDevMode } from '@angular/core';
import {
  TranslocoConfig,
  TranslocoMissingHandler,
  TranslocoService,
} from '@jsverse/transloco';

const KEY_SHAPE = /^[\w-]+(?:\.[\w-]+)+$/;

export function hasKeyShape(text: string): boolean {
  return KEY_SHAPE.test(text);
}

export function holdsStrings(transloco: TranslocoService, lang: string): boolean {
  return Object.keys(transloco.getTranslation(lang) ?? {}).length > 0;
}

@Injectable()
export class ShellMissingTranslationHandler implements TranslocoMissingHandler {
  private readonly injector = inject(Injector);

  handle(key: string, config: TranslocoConfig): string {
    if (
      isDevMode() &&
      config.missingHandler.logMissingKey &&
      hasKeyShape(key) &&
      this.loaded()
    ) {
      console.warn(
        `%c Missing translation for '${key}'`,
        'font-size: 12px; color: red',
      );
    }
    return key;
  }

  private loaded(): boolean {
    const transloco = this.injector.get(TranslocoService);
    return holdsStrings(transloco, transloco.getActiveLang());
  }
}
