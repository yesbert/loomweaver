import { afterEveryRender, Directive, ElementRef, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { rovingStep, rovingTabIndex } from '../../../elements/roving-focus';

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
    const next = rovingStep(event.key, current, tabs.length, 'horizontal');
    if (next === undefined) {
      return;
    }
    event.preventDefault();
    tabs[next].focus();
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
    rovingTabIndex(tabs, tabs.indexOf(stop));
  }

  private tabs(): HTMLElement[] {
    const list = this.host.nativeElement;
    return [...list.querySelectorAll<HTMLElement>('[role="tab"]')].filter(
      (tab) => tab.parentElement?.closest('[role="tablist"]') === list,
    );
  }
}
