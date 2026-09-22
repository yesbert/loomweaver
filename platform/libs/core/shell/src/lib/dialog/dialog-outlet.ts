import { DOCUMENT, NgComponentOutlet } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, afterRenderEffect, effect, inject, viewChildren } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LwButton } from '../elements/button/lw-button';
import { LwSpinner } from '../elements/spinner/lw-spinner';
import { DIALOG_CLOSE_GUARD } from './dialog-close-guard';
import {
  DialogButtonView,
  DialogInstance,
  DialogService,
  DialogSize,
  DialogTone,
} from './dialog.service';

const PANEL_WIDTH: Record<DialogSize, string> = {
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-6xl',
};

const MAXIMIZED_PANEL = 'h-[94vh] w-[96vw] max-w-none';

const TONE_CIRCLE: Record<DialogTone, string> = {
  default: 'bg-brand/10 text-brand',
  info: 'bg-info/10 text-info',
  success: 'bg-positive/10 text-positive',
  warning: 'bg-caution/10 text-caution',
  danger: 'bg-negative/10 text-negative',
};

/**
 * Renders the open dialogs once, mounted by the shell root. Draws the frame
 * (backdrop, panel, title, close-X, footer buttons) and either the convenience body
 * (message + optional prompt input) or a plugin's custom body via NgComponentOutlet.
 * Owns the modal mechanics: scroll-lock, Escape + backdrop dismiss (an Escape something inside
 * already handled is left alone), focus into the newest dialog, and a lightweight focus trap.
 * `DialogService` returns the focus to the opener once the closed dialog has left the page.
 */
@Component({
  selector: 'lw-dialog-outlet',
  imports: [NgComponentOutlet, TranslocoPipe, LwButton, LwSpinner],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './dialog-outlet.html',
  host: {
    '(document:keydown.escape)': 'onEscape($event)',
    '(document:focusin)': 'onFocusIn($event)',
    '(document:keydown.tab)': 'onTab($event, false)',
    '(document:keydown.shift.tab)': 'onTab($event, true)',
  },
})
export class DialogOutlet {
  private readonly service = inject(DialogService);

  private readonly closeGuard = inject(DIALOG_CLOSE_GUARD);

  private readonly document = inject(DOCUMENT);

  protected readonly dialogs = this.service.dialogs;

  private readonly panels = viewChildren<ElementRef<HTMLElement>>('panel');

  private readonly bodies = viewChildren(NgComponentOutlet);

  private readonly asking = new Set<string>();

  constructor() {
    effect(() => {
      this.document.body.style.overflow = this.dialogs().length ? 'hidden' : '';
    });
    afterRenderEffect(() => {
      const panels = this.panels();
      if (!this.dialogs().length || !panels.length) {
        return;
      }
      const top = panels.at(-1)?.nativeElement;
      if (!top || top.contains(this.document.activeElement)) {
        return;
      }
      (top.querySelector<HTMLElement>('[data-lw-autofocus]') ?? top).focus();
    });
  }

  protected onEscape(event: Event): void {
    if (event.defaultPrevented) {
      return;
    }
    const top = this.top();
    if (top && this.closesDeliberately(top)) {
      this.requestDismiss(top);
    }
  }

  protected onFocusIn(event: FocusEvent): void {
    const top = this.topPanel();
    const target = event.target as Node | null;
    if (top && target && !top.contains(target)) {
      (this.focusable(top)[0] ?? top).focus();
    }
  }

  protected onTab(event: Event, backward: boolean): void {
    const top = this.topPanel();
    if (!top) {
      return;
    }
    const focusables = this.focusable(top);
    if (!focusables.length) {
      return;
    }
    const first = focusables[0];
    const last = focusables.at(-1);
    const active = this.document.activeElement;
    if (backward && active === first) {
      last?.focus();
      event.preventDefault();
    } else if (!backward && active === last) {
      first.focus();
      event.preventDefault();
    }
  }

  protected onScrim(dialog: DialogInstance): void {
    if (dialog.dismiss === 'any') {
      this.requestDismiss(dialog);
    }
  }

  protected onCloseControl(dialog: DialogInstance): void {
    if (this.closesDeliberately(dialog)) {
      this.requestDismiss(dialog);
    }
  }

  protected closesDeliberately(dialog: DialogInstance): boolean {
    return dialog.dismiss !== 'none';
  }

  protected onButton(dialog: DialogInstance, button: DialogButtonView): void {
    if (button.role === 'custom' && button.value === undefined) {
      this.requestDismiss(dialog);
    } else if (button.role === 'custom') {
      dialog.ref.close(button.value);
    } else if (button.role === 'cancel') {
      dialog.ref.close();
    } else if (dialog.kind === 'confirm') {
      dialog.ref.close(true);
    } else if (dialog.kind === 'prompt') {
      dialog.ref.close(dialog.promptValue?.());
    } else {
      dialog.ref.close();
    }
  }

  protected onPromptInput(dialog: DialogInstance, event: Event): void {
    dialog.promptValue?.set((event.target as HTMLInputElement).value);
  }

  protected onEnter(dialog: DialogInstance): void {
    if (!dialog.promptValue) {
      return;
    }
    if (
      dialog.requireValidate &&
      dialog.requireValidate(dialog.promptValue()) !== null
    ) {
      return;
    }
    dialog.ref.close(dialog.kind === 'prompt' ? dialog.promptValue() : true);
  }

  protected confirmBlocked(
    dialog: DialogInstance,
    button: DialogButtonView,
  ): boolean {
    return (
      button.role === 'confirm' &&
      !!dialog.requireValidate &&
      dialog.requireValidate(dialog.promptValue?.() ?? '') !== null
    );
  }

  protected guardError(dialog: DialogInstance): string | null {
    const value = dialog.promptValue?.() ?? '';
    if (!dialog.requireValidate || value.length === 0) {
      return null;
    }
    return dialog.requireValidate(value);
  }

  protected wrapperClasses(dialog: DialogInstance): string {
    const base = 'fixed inset-0 z-[70] flex justify-center';
    return dialog.align === 'top'
      ? `${base} items-start p-3 pt-[8vh] sm:p-4 sm:pt-[12vh]`
      : `${base} items-end sm:items-center sm:p-4`;
  }

  protected toneCircle(tone: DialogTone): string {
    return TONE_CIRCLE[tone];
  }

  protected panelWidth(dialog: DialogInstance): string {
    if (dialog.ref.maximized()) {
      return MAXIMIZED_PANEL;
    }
    return PANEL_WIDTH[dialog.size ?? 'md'];
  }

  private requestDismiss(dialog: DialogInstance): void {
    if (this.asking.has(dialog.id)) {
      return;
    }
    const body = this.bodyOf(dialog);
    const candidates = body ? [body] : [];
    if (!this.closeGuard.mustAsk(candidates)) {
      dialog.ref.close();
      return;
    }
    this.asking.add(dialog.id);
    void this.closeGuard
      .confirmClose(candidates)
      .then((approved) => {
        if (approved) {
          dialog.ref.close();
        }
      })
      .finally(() => this.asking.delete(dialog.id));
  }

  private bodyOf(dialog: DialogInstance): unknown {
    const index = this.dialogs()
      .filter((open) => open.component)
      .indexOf(dialog);
    return index === -1 ? undefined : this.bodies()[index]?.componentInstance;
  }

  private topPanel(): HTMLElement | undefined {
    const panels = this.panels();
    return panels.at(-1)?.nativeElement;
  }

  private focusable(root: HTMLElement): HTMLElement[] {
    const selector =
      'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';
    return [...root.querySelectorAll<HTMLElement>(selector)];
  }

  private top(): DialogInstance | undefined {
    const list = this.dialogs();
    return list.at(-1);
  }
}
