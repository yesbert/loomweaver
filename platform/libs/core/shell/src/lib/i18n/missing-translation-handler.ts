import { Injectable, Injector, inject, isDevMode } from '@angular/core';
import {
  TranslocoConfig,
  TranslocoMissingHandler,
  TranslocoService,
} from '@jsverse/transloco';

@Injectable()
export class ShellMissingTranslationHandler implements TranslocoMissingHandler {
  private readonly injector = inject(Injector);

  handle(key: string, config: TranslocoConfig): string {
    if (isDevMode() && config.missingHandler.logMissingKey && this.loaded()) {
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
