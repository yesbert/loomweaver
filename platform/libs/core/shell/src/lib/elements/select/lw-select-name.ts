export const FORWARDED_STATE = ['aria-invalid', 'aria-describedby'] as const;

export interface NamedParts {
  readonly trigger: HTMLButtonElement;
  readonly labelPart: HTMLSpanElement;
  readonly valueSlot: HTMLSpanElement;
  readonly listbox?: HTMLDivElement;
}

export function syncAccessibleName(host: HTMLElement, parts: NamedParts): void {
  const { trigger, labelPart, valueSlot, listbox } = parts;
  const ownLabel = host.getAttribute('aria-labelledby');
  const label = host.getAttribute('label') ?? host.getAttribute('aria-label');
  labelPart.textContent = ownLabel === null ? (label ?? '') : '';
  const labelIds = ownLabel ?? (label === null ? null : labelPart.id);
  trigger.removeAttribute('aria-label');
  setOrRemove(
    trigger,
    'aria-labelledby',
    labelIds === null ? null : `${labelIds} ${valueSlot.id}`,
  );
  if (listbox) {
    setOrRemove(listbox, 'aria-labelledby', ownLabel);
    setOrRemove(listbox, 'aria-label', ownLabel === null ? label : null);
  }
}

export function forwardState(host: HTMLElement, trigger: HTMLElement): void {
  for (const name of FORWARDED_STATE) {
    setOrRemove(trigger, name, host.getAttribute(name));
  }
}

function setOrRemove(
  element: HTMLElement,
  name: string,
  value: string | null,
): void {
  if (value === null) {
    element.removeAttribute(name);
  } else {
    element.setAttribute(name, value);
  }
}
