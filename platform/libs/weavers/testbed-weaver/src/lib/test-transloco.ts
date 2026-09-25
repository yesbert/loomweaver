import { ModuleWithProviders } from '@angular/core';
import { Translation, TranslocoTestingModule } from '@jsverse/transloco';

export function translocoForSpec(
  en: Translation = {},
): ModuleWithProviders<TranslocoTestingModule> {
  return TranslocoTestingModule.forRoot({
    langs: { en },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}
