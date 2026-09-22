import { afterEveryRender, Directive, ElementRef, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Directive({
  selector: '[lwRovingTabs]',
  host: {
    '(keydown)': 'onKeydown($event)',
    '(focusin)': 'assignStop()',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class RovingTabs {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);

  constructor() {
    afterEveryRender({ write: () => this.assignStop() });
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }
    const tabs = this.tabs();
    const current = tabs.indexOf(event.target as HTMLElement);
    if (current === -1) {
      return;
    }
    const target = this.targetFor(event.key, tabs, current);
    if (!target) {
      return;
    }
    event.preventDefault();
    target.focus();
  }

  protected onFocusOut(event: FocusEvent): void {
    this.assignStop(event.relatedTarget);
  }

  protected assignStop(
    focused: EventTarget | null = this.document.activeElement,
  ): void {
    const tabs = this.tabs();
    const stop =
      tabs.find((tab) => tab === focused) ??
      tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') ??
      tabs[0];
    for (const tab of tabs) {
      tab.tabIndex = tab === stop ? 0 : -1;
    }
  }

  private targetFor(
    key: string,
    tabs: readonly HTMLElement[],
    current: number,
  ): HTMLElement | undefined {
    switch (key) {
      case 'ArrowRight': {
        return tabs[(current + 1) % tabs.length];
      }
      case 'ArrowLeft': {
        return tabs[(current - 1 + tabs.length) % tabs.length];
      }
      case 'Home': {
        return tabs[0];
      }
      case 'End': {
        return tabs.at(-1);
      }
      default: {
        return undefined;
      }
    }
  }

  private tabs(): HTMLElement[] {
    const list = this.host.nativeElement;
    return [...list.querySelectorAll<HTMLElement>('[role="tab"]')].filter(
      (tab) => tab.parentElement?.closest('[role="tablist"]') === list,
    );
  }
}
