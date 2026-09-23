import { CUSTOM_ELEMENTS_SCHEMA, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LocaleService } from './locale.service';
import { ViewportService } from '../layout/viewport.service';

const FLAGS: Readonly<Partial<Record<string, string>>> = {
  en: '🇬🇧',
  de: '🇩🇪',
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
  protected readonly compact = inject(ViewportService).compact;

  protected readonly langs = this.locale.languages.map(({ code, name }) => ({
    value: code,
    label: name,
    flag: FLAGS[code] ?? code.toUpperCase(),
  }));

  protected onSelect(event: Event): void {
    const value = (event as CustomEvent<{ value: string }>).detail.value;
    this.locale.setLang(value);
  }
}
