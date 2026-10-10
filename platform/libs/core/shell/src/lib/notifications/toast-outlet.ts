import { DOCUMENT } from '@angular/common';
import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  inject,
  viewChild,
  viewChildren,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LwButton } from '../elements/button/lw-button';
import {
  Notification,
  NotificationKind,
  NotificationService,
} from './notification.service';
import { FEEDBACK_COLORS, FeedbackColors } from './feedback-colors';
import { TOAST_POSITION } from './toast-options';
import { toastPlacement } from './toast-placement';

const COLORS: Record<NotificationKind, FeedbackColors> = {
  info: FEEDBACK_COLORS.info,
  success: FEEDBACK_COLORS.success,
  warning: FEEDBACK_COLORS.warning,
  error: FEEDBACK_COLORS.negative,
};

/**
 * Renders the notifications to show as toasts at the edge the distribution chose
 * (`provideShell({ toastPosition })`, bottom right by default). Mounted once by the shell root, so
 * every distribution gets it for free. Each toast shows its kind by colour and by icon, its
 * message, how often it was raised, an optional action button and a dismiss control. Once the
 * pointer moves on a toast, and while keyboard focus is in one, no toast leaves by itself.
 */
@Component({
  selector: 'lw-toasts',
  imports: [TranslocoPipe, LwButton],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './toast-outlet.html',
})
export class ToastOutlet {
  private readonly service = inject(NotificationService);
  private readonly document = inject(DOCUMENT);
  private readonly region = viewChild<ElementRef<HTMLElement>>('region');
  private readonly dismissButtons =
    viewChildren<ElementRef<HTMLElement>>('dismissButton');
  private readonly placement = toastPlacement(inject(TOAST_POSITION));
  private regionThePointerIsOn: HTMLElement | undefined;
  protected readonly regionPlacement = this.placement.region;
  protected readonly enteringFrom = this.placement.entering;
  protected readonly notifications = computed(() =>
    this.placement.newestFirst
      ? this.service.notifications().toReversed()
      : this.service.notifications(),
  );

  protected iconFor(toast: Notification): string {
    return toast.icon ?? toast.kind;
  }

  protected textOf(kind: NotificationKind): string {
    return COLORS[kind].text;
  }

  protected edgeOf(kind: NotificationKind): string {
    return COLORS[kind].edge;
  }

  protected tintOf(kind: NotificationKind): string {
    return COLORS[kind].tint;
  }

  protected roleFor(kind: NotificationKind): 'alert' | 'status' {
    return kind === 'error' || kind === 'warning' ? 'alert' : 'status';
  }

  protected runAction(toast: Notification, click: MouseEvent): void {
    this.giveUpAttention(click);
    toast.action?.run();
    this.service.dismiss(toast.id);
  }

  protected dismiss(id: string, click: MouseEvent): void {
    this.giveUpAttention(click);
    this.service.dismiss(id);
  }

  protected pointerMoved(): void {
    this.regionThePointerIsOn = this.region()?.nativeElement;
    this.service.hold();
  }

  protected pointerLeft(): void {
    this.regionThePointerIsOn = undefined;
    this.releaseUnlessAttended(this.document.activeElement);
  }

  protected focusEntered(): void {
    this.service.hold();
  }

  protected focusLeft(event: FocusEvent): void {
    this.releaseUnlessAttended(event.relatedTarget);
  }

  private giveUpAttention(click: MouseEvent): void {
    const control = click.currentTarget as HTMLElement;
    const neighbour = wasByKeyboard(click)
      ? this.dismissButtonBeside(control)
      : undefined;
    if (neighbour) {
      neighbour.focus();
      return;
    }
    if (!wasByKeyboard(click)) {
      this.regionThePointerIsOn = undefined;
    }
    control.blur();
    this.releaseUnlessAttended(this.document.activeElement);
  }

  private dismissButtonBeside(control: HTMLElement): HTMLElement | undefined {
    const toast = control.closest('[role]');
    const buttons = this.dismissButtons().map((button) => button.nativeElement);
    const own = buttons.findIndex((button) => toast?.contains(button));
    return buttons[own + 1] ?? buttons[own - 1];
  }

  private releaseUnlessAttended(focused: EventTarget | null): void {
    if (!this.hasFocusIn(focused) && !this.isPointerAttending()) {
      this.service.release();
    }
  }

  private hasFocusIn(target: EventTarget | null): boolean {
    const region = this.region()?.nativeElement;
    return (
      region !== undefined && target instanceof Node && region.contains(target)
    );
  }

  private isPointerAttending(): boolean {
    return (
      this.regionThePointerIsOn !== undefined &&
      this.regionThePointerIsOn === this.region()?.nativeElement
    );
  }
}

function wasByKeyboard(click: MouseEvent): boolean {
  return click.detail === 0;
}
