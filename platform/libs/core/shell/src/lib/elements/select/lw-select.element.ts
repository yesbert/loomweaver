import {
  reflectAttribute,
  upgradeElementProperty,
} from '../custom-element-property';

export const LW_SELECT_TAG = 'lw-select';
export const LW_OPTION_TAG = 'lw-option';

export const LW_SELECT_CHANGE = 'lw-select-change';

let nextSelectId = 0;

const TYPEAHEAD_RESET_MS = 500;

interface Choice {
  readonly value: string;
  readonly label: string;
  readonly icon: string | null;
  readonly disabled: boolean;
}

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

export class LwSelectElement extends HTMLElement {
  static readonly observedAttributes = [
    'value',
    'label',
    'placeholder',
    'disabled',
  ];

  private readonly selectId = nextSelectId++;

  private readonly anchorName = `--lw-select-${this.selectId}`;

  private readonly listboxId = `lw-select-listbox-${this.selectId}`;

  private open = false;

  private activeIndex = 0;

  private typeahead = '';

  private typeaheadTimer?: ReturnType<typeof setTimeout>;

  private trigger?: HTMLButtonElement;

  private valueSlot?: HTMLSpanElement;

  private listbox?: HTMLDivElement;

  private observer?: MutationObserver;

  get value(): string | null {
    return this.getAttribute('value');
  }

  set value(value: string | null) {
    reflectAttribute(this, 'value', value);
  }

  connectedCallback(): void {
    upgradeElementProperty(this, 'value');
    if (!this.trigger) {
      this.buildControl();
    }

    this.observer = new MutationObserver(() => this.syncTrigger());
    this.observe();
    this.syncTrigger();
  }

  disconnectedCallback(): void {
    this.observer?.disconnect();
    document.removeEventListener('pointerdown', this.onOutsidePointer, true);
    if (this.typeaheadTimer !== undefined) {
      clearTimeout(this.typeaheadTimer);
    }
  }

  attributeChangedCallback(name: string): void {
    if (!this.trigger) {
      return;
    }

    if (
      name === 'value' ||
      name === 'label' ||
      name === 'placeholder' ||
      name === 'disabled'
    ) {
      this.syncTrigger();
    }
    if (name === 'disabled' && this.hasAttribute('disabled')) {
      this.close(false);
    }
  }

  private readonly onOutsidePointer = (event: PointerEvent) => {
    if (!this.contains(event.target as Node)) {
      this.close(false);
    }
  };

  private observe(): void {
    this.observer?.observe(this, {
      childList: true,
      characterData: true,
      subtree: true,
      attributes: true,
    });
  }

  private write(function_: () => void): void {
    this.observer?.disconnect();
    try {
      function_();
    } finally {
      this.observe();
    }
  }

  private choices(): Choice[] {
    return [...this.querySelectorAll(LW_OPTION_TAG)].map((option) => ({
      value: option.getAttribute('value') ?? '',
      label: (option.textContent ?? '').trim(),
      icon: option.getAttribute('icon'),
      disabled: option.hasAttribute('disabled'),
    }));
  }

  private selectedChoice(): Choice | undefined {
    const value = this.value;
    return this.choices().find((choice) => choice.value === value);
  }

  private buildControl(): void {
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'lw-select-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', this.listboxId);
    trigger.style.setProperty('anchor-name', this.anchorName);
    trigger.addEventListener('click', () => this.toggle());
    trigger.addEventListener('keydown', (event) =>
      this.onTriggerKeydown(event),
    );

    const valueSlot = document.createElement('span');
    valueSlot.className = 'lw-select-value';
    const chevron = document.createElement('span');
    chevron.className = 'lw-select-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = '▾';
    trigger.append(valueSlot, chevron);

    const listbox = document.createElement('div');
    listbox.id = this.listboxId;
    listbox.className = 'lw-select-listbox';
    listbox.setAttribute('role', 'listbox');
    listbox.hidden = true;
    listbox.style.setProperty('position-anchor', this.anchorName);
    listbox.addEventListener('keydown', (event) =>
      this.onListboxKeydown(event),
    );

    this.append(trigger, listbox);
    this.trigger = trigger;
    this.valueSlot = valueSlot;
    this.listbox = listbox;
  }

  private syncTrigger(): void {
    const trigger = this.trigger;
    const valueSlot = this.valueSlot;
    if (!trigger || !valueSlot) {
      return;
    }
    const label = this.getAttribute('label');
    const selected = this.selectedChoice();
    const text = selected?.label ?? this.getAttribute('placeholder') ?? '';
    const icon = selected?.icon ?? null;
    this.write(() => {
      trigger.disabled = this.hasAttribute('disabled');
      if (label !== null) {
        trigger.setAttribute('aria-label', label);
        this.listbox?.setAttribute('aria-label', label);
      }
      valueSlot.textContent = '';
      if (icon) {
        const glyph = document.createElement('span');
        glyph.className = 'lw-select-glyph';
        glyph.setAttribute('aria-hidden', 'true');
        glyph.textContent = icon;
        valueSlot.append(glyph);
      }
      valueSlot.append(document.createTextNode(text));
    });
  }

  private toggle(): void {
    if (this.open) {
      this.close();
    } else {
      this.openListbox();
    }
  }

  private openListbox(): void {
    const listbox = this.listbox;
    const trigger = this.trigger;
    if (this.open || this.hasAttribute('disabled') || !listbox || !trigger) {
      return;
    }
    this.renderOptions();
    this.open = true;
    this.write(() => {
      listbox.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
    });
    const choices = this.choices();
    const selected = choices.findIndex((choice) => choice.value === this.value);
    this.setActive(Math.max(0, selected));

    document.addEventListener('pointerdown', this.onOutsidePointer, {capture: true});
  }

  private close(refocusTrigger = true): void {
    const listbox = this.listbox;
    const trigger = this.trigger;
    if (!this.open || !listbox || !trigger) {
      return;
    }
    this.open = false;
    this.write(() => {
      listbox.hidden = true;
      listbox.replaceChildren();
      trigger.setAttribute('aria-expanded', 'false');
    });
    document.removeEventListener('pointerdown', this.onOutsidePointer, true);
    if (refocusTrigger) {
      trigger.focus();
    }
  }

  private renderOptions(): void {
    if (!this.listbox) {
      return;
    }
    const items = this.choices().map((choice, index) => {
      const option = document.createElement('div');
      option.className = 'lw-select-option';
      option.setAttribute('role', 'option');
      option.id = `${this.listboxId}-opt-${index}`;
      option.dataset['value'] = choice.value;
      option.setAttribute('aria-selected', String(choice.value === this.value));
      option.tabIndex = -1;
      if (choice.disabled) {
        option.setAttribute('aria-disabled', 'true');
      }
      if (choice.icon) {
        const glyph = document.createElement('span');
        glyph.className = 'lw-select-glyph';
        glyph.setAttribute('aria-hidden', 'true');
        glyph.textContent = choice.icon;
        option.append(glyph);
      }
      option.append(document.createTextNode(choice.label));
      option.addEventListener('click', () => {
        if (!choice.disabled) {
          this.commit(choice.value);
        }
      });
      option.addEventListener('pointermove', () => this.setActive(index));
      return option;
    });
    const listbox = this.listbox;
    this.write(() => listbox.replaceChildren(...items));
  }

  private setActive(index: number): void {
    if (!this.listbox) {
      return;
    }
    const options = [...this.listbox.children] as HTMLElement[];
    if (options.length === 0) {
      return;
    }
    this.activeIndex = Math.max(0, Math.min(index, options.length - 1));
    this.write(() => {
      for (const [index_, option] of options.entries()) {
        option.classList.toggle('is-active', index_ === this.activeIndex);
        option.tabIndex = index_ === this.activeIndex ? 0 : -1;
      }
    });
    const active = options[this.activeIndex];
    active.focus();
    active.scrollIntoView?.({ block: 'nearest' });
  }

  private onTriggerKeydown(event: KeyboardEvent): void {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      this.openListbox();
    }
  }

  private onListboxKeydown(event: KeyboardEvent): void {
    const last = this.choices().length - 1;
    switch (event.key) {
      case 'ArrowDown':
        this.setActive(this.activeIndex >= last ? 0 : this.activeIndex + 1);
        break;
      case 'ArrowUp':
        this.setActive(this.activeIndex <= 0 ? last : this.activeIndex - 1);
        break;
      case 'Home':
        this.setActive(0);
        break;
      case 'End':
        this.setActive(last);
        break;
      case 'Enter':
      case ' ':
        this.commitActive();
        break;
      case 'Escape':
        this.close();
        break;
      case 'Tab':
        this.close(false);
        return;
      default:
        if (event.key.length === 1) {
          this.onTypeahead(event.key);
        }
        return;
    }
    event.preventDefault();
  }

  private onTypeahead(char: string): void {
    this.typeahead += char.toLowerCase();
    if (this.typeaheadTimer !== undefined) {
      clearTimeout(this.typeaheadTimer);
    }
    this.typeaheadTimer = setTimeout(
      () => (this.typeahead = ''),
      TYPEAHEAD_RESET_MS,
    );
    const match = this.choices().findIndex(
      (choice) =>
        !choice.disabled &&
        choice.label.toLowerCase().startsWith(this.typeahead),
    );
    if (match !== -1) {
      this.setActive(match);
    }
  }

  private commitActive(): void {
    const choice = this.choices()[this.activeIndex];
    if (choice && !choice.disabled) {
      this.commit(choice.value);
    }
  }

  private commit(value: string): void {
    const changed = value !== this.value;
    this.value = value;
    this.close();
    if (changed) {
      this.dispatchEvent(
        new CustomEvent(LW_SELECT_CHANGE, { detail: { value }, bubbles: true }),
      );
    }
  }
}

export function defineLwSelect(): void {
  if (typeof customElements === 'undefined') {
    return;
  }
  if (!customElements.get(LW_OPTION_TAG)) {
    customElements.define(LW_OPTION_TAG, LwOptionElement);
  }
  if (!customElements.get(LW_SELECT_TAG)) {
    customElements.define(LW_SELECT_TAG, LwSelectElement);
  }
}
