import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  inject,
  Injector,
  Service,
  signal,
  Type,
  WritableSignal,
} from '@angular/core';
import { LwButtonVariant } from '../elements/button/lw-button';
import { LoomIconName } from '../elements/icon/loom-icons';
import {
  AlertOptions,
  ConfirmOptions,
  DialogButton,
  DialogDismiss,
  DialogRef,
  DialogSize,
  DialogTone,
  OpenOptions,
  ProgressHandle,
  ProgressOptions,
  PromptOptions,
} from '@loomweaver/plugin-sdk';

export type {
  DialogTone,
  DialogSize,
  RequireConfirmation,
  ConfirmOptions,
  AlertOptions,
  PromptOptions,
  DialogButton,
  DialogDismiss,
  ProgressOptions,
  ProgressHandle,
  OpenOptions,
} from '@loomweaver/plugin-sdk';

const TONE_BUTTON: Record<DialogTone, LwButtonVariant> = {
  default: 'primary',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
};

const TONE_ICON: Record<DialogTone, LoomIconName | undefined> = {
  default: undefined,
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'warning',
};

export type DialogKind = 'confirm' | 'alert' | 'prompt' | 'custom' | 'progress';
export type ButtonRole = 'confirm' | 'cancel' | 'custom';

/** A footer button as the dialog outlet renders it. */
export interface DialogButtonView {
  readonly label: string;
  readonly variant: LwButtonVariant;
  readonly role: ButtonRole;
  readonly value?: unknown;
  readonly autofocus: boolean;
}

/** One open dialog, held by the service and rendered by the dialog outlet. */
export interface DialogInstance {
  readonly id: string;
  readonly ref: DialogRef;
  readonly kind: DialogKind;
  readonly tone: DialogTone;
  /** Host icon name (from options or the tone default); rendered by `<lw-icon>`. */
  readonly icon?: string;
  readonly title?: string;
  readonly message?: string;
  readonly component?: Type<unknown>;
  readonly injector?: Injector;
  readonly placeholder?: string;
  readonly promptValue?: WritableSignal<string>;
  /** Live status text for a `progress` dialog. */
  readonly progressMessage?: WritableSignal<string>;
  /** Type-to-confirm label (Markdown) shown above the input, if any. */
  readonly requireLabel?: string;
  /** Validates the guard input; `null` = valid (enables confirm), else an inline error. */
  readonly requireValidate?: (value: string) => string | null;
  readonly buttons: readonly DialogButtonView[];
  readonly dismiss: DialogDismiss;
  readonly size?: DialogSize;
  /** Render only the component (no host chrome) — the component owns the frame contents. */
  readonly bare?: boolean;
  /** The frame shows a maximize/restore control (framed dialogs; bare ones draw their own). */
  readonly maximizable?: boolean;
  /** Vertical anchor: `'top'` pins the panel's top edge on every width. Defaults to `'center'`. */
  readonly align?: 'center' | 'top';
}

/**
 * Neutral host service for modal dialogs:
 * convenience dialogs (`confirm`/`alert`/`prompt`, the host paints everything) and rich
 * `open(Component)` dialogs where a plugin owns the body and the host paints the frame +
 * declarative footer buttons. The shell renders them once via `<lw-dialog-outlet>`. Uses
 * only `<lw-*>` chrome + semantic tokens, so plugin-authored bodies stay harmonious.
 */
@Service()
export class DialogService {
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private readonly items = signal<readonly DialogInstance[]>([]);

  private dismissal: ((dialog: DialogInstance) => Promise<boolean>) | undefined;
  private counter = 0;

  /** The currently open dialogs, oldest first (the last one is topmost). */
  readonly dialogs = this.items.asReadonly();

  /** Asks a yes/no question; resolves `true` only if confirmed. */
  confirm(options: ConfirmOptions): Promise<boolean> {
    const tone = options.tone ?? 'default';
    const guard = options.requireConfirmation;
    const ref = this.push({
      kind: 'confirm',
      tone,
      icon: toneIcon(options, tone),
      title: options.title,
      message: options.message,
      promptValue: guard ? signal('') : undefined,
      requireLabel: guard?.label,
      requireValidate: guard?.validate,
      placeholder: guard?.placeholder,
      dismiss: 'any',
      buttons: cancelAndConfirm(tone, options, !guard),
    });
    return ref.closed.then((result) => result === true);
  }

  /** Shows a message with a single acknowledge button. */
  alert(options: AlertOptions): Promise<void> {
    const tone = options.tone ?? 'default';
    const ref = this.push({
      kind: 'alert',
      tone,
      icon: toneIcon(options, tone),
      title: options.title,
      message: options.message,
      dismiss: 'any',
      buttons: [
        {
          label: options.okLabel ?? 'dialog.ok',
          variant: TONE_BUTTON[tone],
          role: 'confirm',
          autofocus: true,
        },
      ],
    });
    return ref.closed.then(() => undefined);
  }

  /** Asks for a line of text; resolves the value, or `null` if cancelled/dismissed. */
  prompt(options: PromptOptions): Promise<string | null> {
    const tone = options.tone ?? 'default';
    const value = signal(options.initial ?? '');
    const ref = this.push({
      kind: 'prompt',
      tone,
      icon: toneIcon(options, tone),
      title: options.title,
      message: options.message,
      placeholder: options.placeholder,
      promptValue: value,
      dismiss: 'any',
      buttons: cancelAndConfirm(tone, options, false),
    });
    return ref.closed.then((result) =>
      result === undefined ? null : (result as string),
    );
  }

  /**
   * Opens a custom body component. The host paints the frame + any declarative footer
   * buttons; the component owns the body and injects {@link DialogRef} to close itself.
   */
  open<R = unknown>(
    component: Type<unknown>,
    options: OpenOptions = {},
  ): DialogRef<R> {
    const ref: DialogRef = new DialogRef(options.data, () =>
      this.requestClose(ref),
    );
    const injector = Injector.create({
      providers: [{ provide: DialogRef, useValue: ref }],
      parent: this.injector,
    });
    const tone = options.tone ?? 'default';
    this.mount(
      {
        kind: 'custom',
        tone,
        icon: toneIcon(options, tone),
        title: options.title,
        component,
        injector,
        buttons: customButtons(options.buttons ?? []),
        dismiss: options.dismiss ?? 'any',
        size: options.size,
        bare: options.bare,
        maximizable: options.maximizable,
        align: options.align,
      },
      ref,
    );
    return ref as unknown as DialogRef<R>;
  }

  /**
   * Shows a non-dismissable busy indicator (spinner + status) so a running operation is not
   * interrupted. The caller closes it when done — or use {@link withProgress} to auto-close.
   */
  progress(options: ProgressOptions): ProgressHandle {
    const message = signal(options.message);
    const ref = this.push({
      kind: 'progress',
      tone: 'default',
      title: options.title,
      progressMessage: message,
      dismiss: 'none',
      buttons: [],
    });
    return {
      update: (next) => message.set(next),
      close: () => ref.close(),
    };
  }

  /** Runs `work` behind a progress dialog that closes automatically when it settles. */
  async withProgress<T>(
    options: ProgressOptions,
    work: Promise<T>,
  ): Promise<T> {
    const handle = this.progress(options);
    try {
      return await work;
    } finally {
      handle.close();
    }
  }

  /**
   * Connects the outlet that draws the dialogs, so a body's request for the person's close runs the
   * outlet's own dismissal. Returns the disconnect.
   */
  connectDismissal(
    dismiss: (dialog: DialogInstance) => Promise<boolean>,
  ): () => void {
    this.dismissal = dismiss;
    return () => {
      if (this.dismissal === dismiss) {
        this.dismissal = undefined;
      }
    };
  }

  private requestClose(ref: DialogRef): Promise<boolean> {
    const dialog = this.items().find((open) => open.ref === ref);
    if (dialog && this.dismissal) {
      return this.dismissal(dialog);
    }
    ref.close();
    return Promise.resolve(true);
  }

  private push(spec: Omit<DialogInstance, 'id' | 'ref'>): DialogRef {
    const ref = new DialogRef();
    this.mount(spec, ref);
    return ref;
  }

  private mount(
    spec: Omit<DialogInstance, 'id' | 'ref'>,
    ref: DialogRef,
  ): void {
    const id = `lw.dialog.${this.counter++}`;
    const trigger = this.document.activeElement as HTMLElement | null;
    this.items.update((list) => [...list, { ...spec, id, ref }]);

    void ref.closed.then(() => {
      this.items.update((list) => list.filter((dialog) => dialog.id !== id));
      afterNextRender(() => this.giveFocusBack(trigger), {
        injector: this.injector,
      });
    });
  }

  private giveFocusBack(trigger: HTMLElement | null): void {
    if (trigger?.isConnected) {
      trigger.focus();
    }
  }
}

function toneIcon(
  options: { readonly icon?: string },
  tone: DialogTone,
): string | undefined {
  return options.icon ?? TONE_ICON[tone];
}

function cancelAndConfirm(
  tone: DialogTone,
  labels: { readonly cancelLabel?: string; readonly confirmLabel?: string },
  focusConfirm: boolean,
): DialogButtonView[] {
  return [
    {
      label: labels.cancelLabel ?? 'dialog.cancel',
      variant: 'default',
      role: 'cancel',
      autofocus: false,
    },
    {
      label: labels.confirmLabel ?? 'dialog.ok',
      variant: TONE_BUTTON[tone],
      role: 'confirm',
      autofocus: focusConfirm,
    },
  ];
}

function customButtons(specs: readonly DialogButton[]): DialogButtonView[] {
  return specs.map((button, index) => ({
    label: button.label,
    variant: button.variant ?? 'default',
    role: 'custom',
    value: button.value,
    autofocus: index === specs.length - 1,
  }));
}
