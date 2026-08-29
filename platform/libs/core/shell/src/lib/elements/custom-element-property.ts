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
