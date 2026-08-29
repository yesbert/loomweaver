import {
  reflectAttribute,
  upgradeElementProperty,
} from '../custom-element-property';
import { LW_OPTION_TAG, LwOptionElement } from './lw-option.element';
import {
  Choice,
  createListbox,
  createOptionRow,
  createTrigger,
  fillValueSlot,
  readChoices,
} from './lw-select-parts';

export const LW_SELECT_TAG = 'lw-select';

export const LW_SELECT_CHANGE = 'lw-select-change';

let nextSelectId = 0;

const TYPEAHEAD_RESET_MS = 500;

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
    return readChoices(this);
  }

  private selectedChoice(): Choice | undefined {
    const value = this.value;
    return this.choices().find((choice) => choice.value === value);
  }

  private buildControl(): void {
    const { trigger, valueSlot } = createTrigger({
      anchorName: this.anchorName,
      listboxId: this.listboxId,
      onToggle: () => this.toggle(),
      onKeydown: (event) => this.onTriggerKeydown(event),
    });
    const listbox = createListbox({
      anchorName: this.anchorName,
      listboxId: this.listboxId,
      onKeydown: (event) => this.onListboxKeydown(event),
    });

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
    this.write(() => {
      trigger.disabled = this.hasAttribute('disabled');
      if (label !== null) {
        trigger.setAttribute('aria-label', label);
        this.listbox?.setAttribute('aria-label', label);
      }
      fillValueSlot(valueSlot, text, selected?.icon ?? null);
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

    document.addEventListener('pointerdown', this.onOutsidePointer, {
      capture: true,
    });
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
    const listbox = this.listbox;
    if (!listbox) {
      return;
    }
    const rows = this.choices().map((choice, index) =>
      createOptionRow({
        choice,
        id: `${this.listboxId}-opt-${index}`,
        selected: choice.value === this.value,
        onPick: () => this.commit(choice.value),
        onHover: () => this.setActive(index),
      }),
    );
    this.write(() => listbox.replaceChildren(...rows));
  }

  private setActive(index: number): void {
    if (!this.listbox) {
      return;
    }
    const rows = [...this.listbox.children] as HTMLElement[];
    if (rows.length === 0) {
      return;
    }
    this.activeIndex = Math.max(0, Math.min(index, rows.length - 1));
    this.write(() => {
      for (const [index_, row] of rows.entries()) {
        row.classList.toggle('is-active', index_ === this.activeIndex);
        row.tabIndex = index_ === this.activeIndex ? 0 : -1;
      }
    });
    const active = rows[this.activeIndex];
    active.focus();
    active.scrollIntoView?.({ block: 'nearest' });
  }

  private onTriggerKeydown(event: KeyboardEvent): void {
    if (!['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      return;
    }

    event.preventDefault();
    this.openListbox();
  }

  private onListboxKeydown(event: KeyboardEvent): void {
    const last = this.choices().length - 1;
    switch (event.key) {
      case 'ArrowDown': {
        this.setActive(this.activeIndex >= last ? 0 : this.activeIndex + 1);
        break;
      }
      case 'ArrowUp': {
        this.setActive(this.activeIndex <= 0 ? last : this.activeIndex - 1);
        break;
      }
      case 'Home': {
        this.setActive(0);
        break;
      }
      case 'End': {
        this.setActive(last);
        break;
      }
      case 'Enter':
      case ' ': {
        this.commitActive();
        break;
      }
      case 'Escape': {
        this.close();
        break;
      }
      case 'Tab': {
        this.close(false);
        return;
      }
      default: {
        if (event.key.length === 1) {
          this.onTypeahead(event.key);
        }
        return;
      }
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
