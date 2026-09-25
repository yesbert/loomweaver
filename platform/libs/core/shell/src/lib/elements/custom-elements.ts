export function upgradeElementProperty(element: HTMLElement, name: string): void {
  const self = element as unknown as Record<string, unknown>;
  if (Object.hasOwn(element, name)) {
    const value = self[name];
    delete self[name];
    self[name] = value;
  }
}

export function reflectAttribute(
  element: HTMLElement,
  name: string,
  value: string | null | undefined,
): void {
  if (value === null || value === undefined) {
    element.removeAttribute(name);
  } else {
    element.setAttribute(name, value);
  }
}

export function defineElementOnce(
  tag: string,
  element: CustomElementConstructor,
): void {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) {
    customElements.define(tag, element);
  }
}

export function numberAttribute(
  element: HTMLElement,
  name: string,
  fallback: number,
): number {
  const raw = element.getAttribute(name);
  if (raw === null || raw.trim() === '') {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function clickOnEnterOrSpace(
  element: HTMLElement,
  isDisabled: () => boolean = () => false,
): (event: KeyboardEvent) => void {
  return (event) => {
    if ((event.key !== 'Enter' && event.key !== ' ') || isDisabled()) {
      return;
    }
    event.preventDefault();
    element.click();
  };
}
