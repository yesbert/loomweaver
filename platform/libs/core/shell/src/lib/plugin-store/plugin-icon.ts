import { Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';

@Component({
  selector: 'lw-plugin-icon',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './plugin-icon.html',
  host: { class: 'flex shrink-0' },
})
export class PluginIcon {
  readonly src = input<string | undefined>(undefined);
}
