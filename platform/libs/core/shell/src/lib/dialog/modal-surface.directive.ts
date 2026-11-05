import { DOCUMENT } from '@angular/common';
import {
  afterRenderEffect,
  Directive,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';
import { focusBehindMenu } from '../elements/menu/overlay-menu';
import { DialogService } from './dialog.service';
import {
  focusInto,
  pullFocusBackInto,
  wrapFocusWithin,
} from './modal-focus';

@Directive({
  selector: '[lwModalSurface]',
  host: {
    tabindex: '-1',
    '(document:keydown.escape)': 'onEscape($event)',
    '(document:focusin)': 'onFocusIn($event)',
    '(document:keydown.tab)': 'onTab($event, false)',
    '(document:keydown.shift.tab)': 'onTab($event, true)',
  },
})
export class ModalSurfaceDirective {
  readonly open = input.required<boolean>({ alias: 'lwModalSurface' });
  readonly dismissed = output<void>();

  private readonly host =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly dialogs = inject(DialogService).dialogs;

  private opener: HTMLElement | null = null;
  private wasOpen = false;

  constructor() {
    afterRenderEffect(() => {
      const open = this.open();
      if (open === this.wasOpen) {
        return;
      }
      this.wasOpen = open;
      if (open) {
        this.takeFocus();
      } else {
        this.giveFocusBack();
      }
    });
  }

  protected onEscape(event: Event): void {
    if (!this.holdsTheKeyboard() || event.defaultPrevented) {
      return;
    }
    event.preventDefault();
    this.dismissed.emit();
  }

  protected onFocusIn(event: FocusEvent): void {
    if (this.holdsTheKeyboard()) {
      pullFocusBackInto(this.host, event.target as Node | null, this.document);
    }
  }

  protected onTab(event: Event, backward: boolean): void {
    if (
      this.holdsTheKeyboard() &&
      wrapFocusWithin(this.host, this.document.activeElement, backward)
    ) {
      event.preventDefault();
    }
  }

  private holdsTheKeyboard(): boolean {
    return this.open() && this.dialogs().length === 0;
  }

  private takeFocus(): void {
    this.opener = focusBehindMenu(this.document);
    focusInto(this.host, this.document);
  }

  private giveFocusBack(): void {
    const opener = this.opener;
    this.opener = null;
    if (opener?.isConnected) {
      opener.focus();
    }
  }
}
