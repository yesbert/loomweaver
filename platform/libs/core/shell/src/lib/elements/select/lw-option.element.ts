import {
  reflectAttribute,
  upgradeElementProperty,
} from '../custom-element-property';

export const LW_OPTION_TAG = 'lw-option';

export class LwOptionElement extends HTMLElement {
  get value(): string | null {
    return this.getAttribute('value');
  }
  set value(value: string | null) {
    reflectAttribute(this, 'value', value);
  }
  get icon(): string | null {
    return this.getAttribute('icon');
  }
  set icon(value: string | null) {
    reflectAttribute(this, 'icon', value);
  }

  connectedCallback(): void {
    upgradeElementProperty(this, 'value');
    upgradeElementProperty(this, 'icon');
  }
}
