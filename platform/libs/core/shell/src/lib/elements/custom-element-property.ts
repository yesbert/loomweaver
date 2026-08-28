export function upgradeElementProperty(el: HTMLElement, name: string): void {
  const self = el as unknown as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(el, name)) {
    const value = self[name];
    delete self[name];
    self[name] = value;
  }
}

export function reflectAttribute(
  el: HTMLElement,
  name: string,
  value: string | null | undefined,
): void {
  if (value === null || value === undefined) {
    el.removeAttribute(name);
  } else {
    el.setAttribute(name, value);
  }
}
