import { afterNextRender, DOCUMENT, Injector } from '@angular/core';

export function focusMovedEntry(selector: string, injector: Injector): void {
  const document = injector.get(DOCUMENT);
  afterNextRender(
    { read: () => document.querySelector<HTMLElement>(selector)?.focus() },
    { injector },
  );
}
