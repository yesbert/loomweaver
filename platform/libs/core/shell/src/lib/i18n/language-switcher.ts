import { CUSTOM_ELEMENTS_SCHEMA, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LocaleService, SupportedLang } from './locale.service';

interface LangDisplay {
  readonly label: string;
  readonly flag: string;
}

const LANG_DISPLAY: Readonly<Record<SupportedLang, LangDisplay>> = {
  en: { label: 'English', flag: '🇬🇧' },
  de: { label: 'Deutsch', flag: '🇩🇪' },
};

@Component({
  selector: 'lw-language-switcher',
  imports: [TranslocoPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './language-switcher.html',
})
export class LanguageSwitcher {
  private readonly locale = inject(LocaleService);
  protected readonly lang = this.locale.lang;

  protected readonly langs = this.locale.supported.map((value) => ({
    value,
    ...LANG_DISPLAY[value],
  }));

  protected onSelect(event: Event): void {
    const value = (event as CustomEvent<{ value: string }>).detail.value;
    this.locale.setLang(value as SupportedLang);
  }
}
