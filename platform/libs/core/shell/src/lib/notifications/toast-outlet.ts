import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
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
  private readonly region = viewChild<ElementRef<HTMLElement>>('region');
  private readonly dismissButtons =
    viewChildren<ElementRef<HTMLElement>>('dismissButton');
  private readonly placement = toastPlacement(inject(TOAST_POSITION));
  private toastUnderPointer: string | undefined;
  private toastWithFocus: string | undefined;
  protected readonly regionPlacement = this.placement.region;
  protected readonly enteringFrom = this.placement.entering;
  protected readonly notifications = computed(() =>
    this.placement.isNewestFirst
      ? this.service.notifications().toReversed()
      : this.service.notifications(),
  );

  constructor() {
    effect(() => this.forgetWhatLeft(this.service.notifications()));
  }

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
    this.handFocusToNeighbour(click);
    toast.action?.run();
    this.service.dismiss(toast.id);
  }

  protected dismiss(id: string, click: MouseEvent): void {
    this.handFocusToNeighbour(click);
    this.service.dismiss(id);
  }

  protected pointerMovedOn(id: string): void {
    if (!this.isShown(id)) {
      return;
    }
    this.toastUnderPointer = id;
    this.service.hold();
  }

  protected pointerLeft(): void {
    this.toastUnderPointer = undefined;
    this.releaseUnlessAttended();
  }

  protected focusEntered(id: string): void {
    if (!this.isShown(id)) {
      return;
    }
    this.toastWithFocus = id;
    this.service.hold();
  }

  protected focusLeft(event: FocusEvent): void {
    if (this.isInRegion(event.relatedTarget)) {
      return;
    }
    this.toastWithFocus = undefined;
    this.releaseUnlessAttended();
  }

  private forgetWhatLeft(shown: readonly Notification[]): void {
    const isStillShown = (id: string | undefined) =>
      shown.some((toast) => toast.id === id);
    if (!isStillShown(this.toastUnderPointer)) {
      this.toastUnderPointer = undefined;
    }
    if (!isStillShown(this.toastWithFocus)) {
      this.toastWithFocus = undefined;
    }
    this.releaseUnlessAttended();
  }

  private releaseUnlessAttended(): void {
    if (
      this.toastUnderPointer === undefined &&
      this.toastWithFocus === undefined
    ) {
      this.service.release();
    }
  }

  private handFocusToNeighbour(click: MouseEvent): void {
    if (wasByKeyboard(click)) {
      this.dismissButtonBeside(click.currentTarget as HTMLElement)?.focus();
    }
  }

  private dismissButtonBeside(control: HTMLElement): HTMLElement | undefined {
    const toast = control.closest('[role]');
    const buttons = this.dismissButtons().map((button) => button.nativeElement);
    const own = buttons.findIndex((button) => toast?.contains(button));
    return buttons[own + 1] ?? buttons[own - 1];
  }

  private isShown(id: string): boolean {
    return this.service.notifications().some((toast) => toast.id === id);
  }

  private isInRegion(target: EventTarget | null): boolean {
    const region = this.region()?.nativeElement;
    return (
      region !== undefined && target instanceof Node && region.contains(target)
    );
  }
}

function wasByKeyboard(click: MouseEvent): boolean {
  return click.detail === 0;
}
