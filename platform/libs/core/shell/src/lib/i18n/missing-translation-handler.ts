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
    const active = transloco.getActiveLang();
    return Object.keys(transloco.getTranslation(active) ?? {}).length > 0;
  }
}
