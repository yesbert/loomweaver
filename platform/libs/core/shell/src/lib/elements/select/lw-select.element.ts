import {
  defineElementOnce,
  reflectAttribute,
  upgradeElementProperty,
} from '../custom-elements';
import { LW_OPTION_TAG, LwOptionElement } from './lw-option.element';
import {
  Choice,
  createListbox,
  createOptionRow,
  createTrigger,
  fillValueSlot,
  readChoices,
} from './lw-select-parts';
import {
  FORWARDED_STATE,
  forwardState,
  syncAccessibleName,
} from './lw-select-name';
import {
  isPrintable,
  openingIndex,
  selectedIndex,
  stepOverEnabled,
  Typeahead,
} from './lw-select-keys';

export const LW_SELECT_TAG = 'lw-select';

export const LW_SELECT_CHANGE = 'lw-select-change';

let nextSelectId = 0;

export class LwSelectElement extends HTMLElement {
  static readonly observedAttributes = [
    'value',
    'label',
    'placeholder',
    'disabled',
    'compact',
    'required',
    'aria-label',
    'aria-labelledby',
    ...FORWARDED_STATE,
  ];

  private readonly selectId = nextSelectId++;

  private readonly anchorName = `--lw-select-${this.selectId}`;

  private readonly listboxId = `lw-select-listbox-${this.selectId}`;

  private isOpen = false;

  private activeIndex = 0;

  private readonly typeahead = new Typeahead();

  private trigger?: HTMLButtonElement;

  private labelPart?: HTMLSpanElement;

  private valueSlot?: HTMLSpanElement;

  private listbox?: HTMLDivElement;

  private observer?: MutationObserver;

  get value(): string | null {
    return this.getAttribute('value');
  }

  set value(value: string | null) {
    reflectAttribute(this, 'value', value);
  }

  get compact(): boolean {
    return this.hasAttribute('compact');
  }

  set compact(value: boolean) {
    this.toggleAttribute('compact', value);
  }

  get required(): boolean {
    return this.hasAttribute('required');
  }

  set required(value: boolean) {
    this.toggleAttribute('required', value);
  }

  connectedCallback(): void {
    upgradeElementProperty(this, 'value');
    upgradeElementProperty(this, 'required');
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
    this.typeahead.clear();
  }

  attributeChangedCallback(name: string): void {
    if (!this.trigger) {
      return;
    }

    this.syncTrigger();
    if (name === 'disabled' && this.hasAttribute('disabled')) {
      this.dismiss();
    }
  }

  private readonly onOutsidePointer = (event: PointerEvent) => {
    if (!this.contains(event.target as Node)) {
      this.dismiss();
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

  private withoutObserving(change: () => void): void {
    this.observer?.disconnect();
    try {
      change();
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
    const { trigger, labelPart, valueSlot } = createTrigger({
      anchorName: this.anchorName,
      listboxId: this.listboxId,
      labelId: `lw-select-label-${this.selectId}`,
      onToggle: () => this.toggle(),
      onKeydown: (event) => this.onTriggerKeydown(event),
    });
    const listbox = createListbox({
      anchorName: this.anchorName,
      listboxId: this.listboxId,
    });

    this.append(labelPart, trigger, listbox);
    this.trigger = trigger;
    this.labelPart = labelPart;
    this.valueSlot = valueSlot;
    this.listbox = listbox;
  }

  private syncTrigger(): void {
    const trigger = this.trigger;
    const labelPart = this.labelPart;
    const valueSlot = this.valueSlot;
    if (!trigger || !labelPart || !valueSlot) {
      return;
    }
    const selected = this.selectedChoice();
    const text = selected?.label ?? this.getAttribute('placeholder') ?? '';
    const iconOnly = this.compact && selected?.icon != null;
    this.withoutObserving(() => {
      trigger.disabled = this.hasAttribute('disabled');
      syncAccessibleName(this, {
        trigger,
        labelPart,
        listbox: this.listbox,
      });
      forwardState(this, trigger);
      fillValueSlot(valueSlot, text, selected?.icon ?? null, iconOnly);
    });
  }

  private toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.openListbox();
    }
  }

  private openListbox(start = selectedIndex(this.choices(), this.value)): void {
    const listbox = this.listbox;
    const trigger = this.trigger;
    if (this.isOpen || this.hasAttribute('disabled') || !listbox || !trigger) {
      return;
    }
    this.renderOptions();
    this.isOpen = true;
    this.withoutObserving(() => {
      listbox.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
    });
    this.setActive(start);

    document.addEventListener('pointerdown', this.onOutsidePointer, {
      capture: true,
    });
  }

  private close(): void {
    if (this.collapse()) {
      this.trigger?.focus();
    }
  }

  private dismiss(): void {
    this.collapse();
  }

  private collapse(): boolean {
    const listbox = this.listbox;
    const trigger = this.trigger;
    if (!this.isOpen || !listbox || !trigger) {
      return false;
    }
    this.isOpen = false;
    this.withoutObserving(() => {
      listbox.hidden = true;
      listbox.replaceChildren();
      trigger.setAttribute('aria-expanded', 'false');
      trigger.removeAttribute('aria-activedescendant');
    });
    document.removeEventListener('pointerdown', this.onOutsidePointer, true);
    return true;
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
    this.withoutObserving(() => listbox.replaceChildren(...rows));
  }

  private setActive(index: number): void {
    const trigger = this.trigger;
    if (!this.listbox || !trigger) {
      return;
    }
    const rows = [...this.listbox.children] as HTMLElement[];
    if (rows.length === 0) {
      return;
    }
    this.activeIndex = Math.max(0, Math.min(index, rows.length - 1));
    const active = rows[this.activeIndex];
    this.withoutObserving(() => {
      for (const [rowIndex, row] of rows.entries()) {
        row.classList.toggle('is-active', rowIndex === this.activeIndex);
      }
      trigger.setAttribute('aria-activedescendant', active.id);
    });
    active.scrollIntoView?.({ block: 'nearest' });
  }

  private onTriggerKeydown(event: KeyboardEvent): void {
    if (this.isOpen) {
      this.onOpenKeydown(event);
    } else {
      this.onClosedKeydown(event);
    }
  }

  private onClosedKeydown(event: KeyboardEvent): void {
    const start = openingIndex(
      event,
      this.choices(),
      this.value,
      this.typeahead,
    );
    if (start === undefined) {
      return;
    }
    event.preventDefault();
    this.openListbox(start);
  }

  private onOpenKeydown(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      this.dismiss();
      return;
    }
    if (this.handleOpenKey(event)) {
      event.preventDefault();
    }
  }

  private handleOpenKey(event: KeyboardEvent): boolean {
    if (event.key === 'ArrowUp' && event.altKey) {
      this.commitActive();
      return true;
    }
    const step = stepOverEnabled(this.choices(), event.key, this.activeIndex);
    if (step !== undefined) {
      this.setActive(step);
      return true;
    }
    switch (event.key) {
      case 'Enter':
      case ' ': {
        this.commitActive();
        return true;
      }
      case 'Escape': {
        this.close();
        return true;
      }
      default: {
        return this.typeIfPrintable(event);
      }
    }
  }

  private typeIfPrintable(event: KeyboardEvent): boolean {
    if (!isPrintable(event)) {
      return false;
    }
    const match = this.typeahead.match(this.choices(), event.key);
    if (match !== undefined) {
      this.setActive(match);
    }
    return true;
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

/** Registers `<lw-select>` and `<lw-option>` once (idempotent), called from {@link provideShell} at bootstrap. */
export function defineLwSelect(): void {
  defineElementOnce(LW_OPTION_TAG, LwOptionElement);
  defineElementOnce(LW_SELECT_TAG, LwSelectElement);
}
