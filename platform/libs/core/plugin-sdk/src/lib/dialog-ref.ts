import { signal } from '@angular/core';

/**
 * Handle to an open dialog. A plugin's dialog body injects it to close itself
 * and read its `data`; `open()` returns it so the caller can await the result via `closed`.
 */
export class DialogRef<R = unknown> {
  private resolveClosed!: (result: R | undefined) => void;
  private settled = false;
  private readonly maximizedState = signal(false);

  /**
   * Whether the dialog is currently maximized to near-fullscreen. The host frame reacts (panel
   * size); a bare dialog body reads it to stretch its own chrome.
   */
  readonly maximized = this.maximizedState.asReadonly();

  /** Resolves with the dialog result once it closes (or `undefined` if dismissed). */
  readonly closed: Promise<R | undefined> = new Promise((resolve) => {
    this.resolveClosed = resolve;
  });

  constructor(
    readonly data?: unknown,
    private readonly closeRequest?: () => Promise<boolean>,
  ) {}

  /**
   * Toggles near-fullscreen. The host frame shows a maximize/restore control when the dialog was
   * opened with `maximizable`; a bare dialog draws its own control and calls this directly.
   */
  toggleMaximized(): void {
    this.maximizedState.update((value) => !value);
  }

  /**
   * Asks for the close the person would make with the dialog's close control, from a control of the
   * body's own such as a cancel beside its other buttons. The body's veto runs first; while the body
   * reports unsaved work the host asks Save · Discard · Cancel, with Save only where the body can
   * save. Resolves `true` once the dialog has closed, and `false` where the person cancelled, a save
   * failed or the veto held. It works whatever the opener allowed the person, and a request made while
   * the question is open does not ask again. {@link close} closes without asking.
   */
  requestClose(): Promise<boolean> {
    if (this.settled) {
      return Promise.resolve(true);
    }
    if (this.closeRequest) {
      return this.closeRequest();
    }
    this.close();
    return Promise.resolve(true);
  }

  /** Closes the dialog with an optional result. Idempotent — later calls are ignored. */
  close(result?: R): void {
    if (this.settled) {
      return;
    }
    this.settled = true;
    this.resolveClosed(result);
  }
}
