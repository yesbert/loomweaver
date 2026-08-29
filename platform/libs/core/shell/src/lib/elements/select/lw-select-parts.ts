import { LW_OPTION_TAG } from './lw-option.element';

export interface Choice {
  readonly value: string;
  readonly label: string;
  readonly icon: string | null;
  readonly disabled: boolean;
}

export interface TriggerParts {
  readonly trigger: HTMLButtonElement;
  readonly valueSlot: HTMLSpanElement;
}

export interface TriggerOptions {
  readonly anchorName: string;
  readonly listboxId: string;
  readonly onToggle: () => void;
  readonly onKeydown: (event: KeyboardEvent) => void;
}

export interface ListboxOptions {
  readonly anchorName: string;
  readonly listboxId: string;
  readonly onKeydown: (event: KeyboardEvent) => void;
}

export interface OptionRowOptions {
  readonly choice: Choice;
  readonly id: string;
  readonly selected: boolean;
  readonly onPick: () => void;
  readonly onHover: () => void;
}

export function readChoices(host: HTMLElement): Choice[] {
  return [...host.querySelectorAll(LW_OPTION_TAG)].map((option) => ({
    value: option.getAttribute('value') ?? '',
    label: (option.textContent ?? '').trim(),
    icon: option.getAttribute('icon'),
    disabled: option.hasAttribute('disabled'),
  }));
}

export function createTrigger(options: TriggerOptions): TriggerParts {
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'lw-select-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', options.listboxId);
  trigger.style.setProperty('anchor-name', options.anchorName);
  trigger.addEventListener('click', options.onToggle);
  trigger.addEventListener('keydown', options.onKeydown);

  const valueSlot = document.createElement('span');
  valueSlot.className = 'lw-select-value';
  const chevron = document.createElement('span');
  chevron.className = 'lw-select-chevron';
  chevron.setAttribute('aria-hidden', 'true');
  chevron.textContent = '▾';
  trigger.append(valueSlot, chevron);

  return { trigger, valueSlot };
}

export function createListbox(options: ListboxOptions): HTMLDivElement {
  const listbox = document.createElement('div');
  listbox.id = options.listboxId;
  listbox.className = 'lw-select-listbox';
  listbox.setAttribute('role', 'listbox');
  listbox.hidden = true;
  listbox.style.setProperty('position-anchor', options.anchorName);
  listbox.addEventListener('keydown', options.onKeydown);
  return listbox;
}

export function fillValueSlot(
  slot: HTMLSpanElement,
  text: string,
  icon: string | null,
): void {
  slot.textContent = '';
  if (icon) {
    slot.append(createGlyph(icon));
  }
  slot.append(document.createTextNode(text));
}

export function createOptionRow(options: OptionRowOptions): HTMLDivElement {
  const choice = options.choice;
  const row = document.createElement('div');
  row.className = 'lw-select-option';
  row.setAttribute('role', 'option');
  row.id = options.id;
  row.dataset['value'] = choice.value;
  row.setAttribute('aria-selected', String(options.selected));
  row.tabIndex = -1;
  if (choice.disabled) {
    row.setAttribute('aria-disabled', 'true');
  }
  if (choice.icon) {
    row.append(createGlyph(choice.icon));
  }
  row.append(document.createTextNode(choice.label));
  row.addEventListener('click', () => {
    if (!choice.disabled) {
      options.onPick();
    }
  });
  row.addEventListener('pointermove', options.onHover);
  return row;
}

function createGlyph(icon: string): HTMLSpanElement {
  const glyph = document.createElement('span');
  glyph.className = 'lw-select-glyph';
  glyph.setAttribute('aria-hidden', 'true');
  glyph.textContent = icon;
  return glyph;
}
