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

const REGION =
  'pointer-events-none fixed inset-x-0 z-[60] flex flex-col items-center gap-2 p-4';
const CARD =
  'pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border bg-surface-raised shadow-lg transition duration-200 ease-out starting:opacity-0';

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
  protected readonly regionClasses = `${REGION} ${this.placement.region}`;
  protected readonly notifications = computed(() =>
    this.placement.newestFirst
      ? this.service.notifications().toReversed()
      : this.service.notifications(),
  );

  protected iconFor(toast: Notification): string {
    return toast.icon ?? toast.kind;
  }

  protected iconClasses(kind: NotificationKind): string {
    return `mt-0.5 shrink-0 ${COLORS[kind].text}`;
  }

  protected cardClasses(kind: NotificationKind): string {
    return `${CARD} ${this.placement.entering} ${COLORS[kind].edge}`;
  }

  protected bodyClasses(kind: NotificationKind): string {
    return `flex items-start gap-3 p-3 ${COLORS[kind].tint}`;
  }

  protected roleFor(kind: NotificationKind): 'alert' | 'status' {
    return kind === 'error' || kind === 'warning' ? 'alert' : 'status';
  }

  protected runAction(toast: Notification, click: MouseEvent): void {
    toast.action?.run();
    this.dismiss(toast.id, click);
  }

  protected dismiss(id: string, click: MouseEvent): void {
    this.takeFocusOffLeavingToast(click);
    this.service.dismiss(id);
  }

  protected hold(): void {
    this.service.hold();
  }

  protected pointerLeft(): void {
    if (!this.holdsFocus(this.document.activeElement)) {
      this.service.release();
    }
  }

  protected focusLeft(event: FocusEvent): void {
    if (!this.holdsFocus(event.relatedTarget) && !this.isHovered()) {
      this.service.release();
    }
  }

  private takeFocusOffLeavingToast(click: MouseEvent): void {
    const control = click.currentTarget as HTMLElement;
    const next = wasByKeyboard(click)
      ? this.dismissButtonOutside(control.closest('[role]'))
      : undefined;
    if (next) {
      next.focus();
    } else {
      control.blur();
    }
  }

  private dismissButtonOutside(toast: Element | null): HTMLElement | undefined {
    return this.dismissButtons()
      .map((button) => button.nativeElement)
      .find((button) => !toast?.contains(button));
  }

  private holdsFocus(target: EventTarget | null): boolean {
    const region = this.region()?.nativeElement;
    return (
      region !== undefined && target instanceof Node && region.contains(target)
    );
  }

  private isHovered(): boolean {
    return this.region()?.nativeElement.matches(':hover') ?? false;
  }
}

function wasByKeyboard(click: MouseEvent): boolean {
  return click.detail === 0;
}
