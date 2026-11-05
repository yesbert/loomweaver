import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  afterRenderEffect,
  DestroyRef,
  Directive,
  ElementRef,
  EnvironmentInjector,
  inject,
  input,
  output,
} from '@angular/core';
import { focusBehindMenu } from '../elements/menu/overlay-menu';
import { DialogService } from './dialog.service';
import {
  focusInto,
  focusIsLost,
  pullFocusBackInto,
  takeFocusAfterOpenMenu,
} from './modal-focus';

@Directive({
  selector: '[lwModalSurface]',
  host: {
    tabindex: '-1',
    '(document:keydown.escape)': 'onEscape($event)',
    '(document:focusin)': 'onFocusIn($event)',
  },
})
export class ModalSurfaceDirective {
  readonly open = input.required<boolean>({ alias: 'lwModalSurface' });
  readonly whereFocusGoesWithoutOpener = input<string>();
  readonly dismissed = output<void>();

  private readonly host =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly dialogs = inject(DialogService).dialogs;
  private readonly environment = inject(EnvironmentInjector);

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
    inject(DestroyRef).onDestroy(() => this.handFocusOnWhenRemovedOpen());
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

  private holdsTheKeyboard(): boolean {
    return this.open() && this.dialogs().length === 0;
  }

  private takeFocus(): void {
    this.opener = focusBehindMenu(this.document);
    focusInto(this.host, this.document);
    takeFocusAfterOpenMenu(this.host, this.document);
  }

  private giveFocusBack(): void {
    const opener = this.opener;
    this.opener = null;
    if (opener?.isConnected) {
      opener.focus();
    }
  }

  private handFocusOnWhenRemovedOpen(): void {
    if (!this.wasOpen) {
      return;
    }
    const opener = this.opener;
    const elsewhere = this.whereFocusGoesWithoutOpener();
    afterNextRender(
      () => {
        if (focusIsLost(this.document) && opener?.isConnected) {
          opener.focus();
        }
        if (focusIsLost(this.document) && elsewhere) {
          this.document.querySelector<HTMLElement>(elsewhere)?.focus();
        }
      },
      { injector: this.environment },
    );
  }
}
