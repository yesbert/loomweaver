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

  constructor(readonly data: unknown = undefined) {}

  /**
   * Toggles near-fullscreen. The host frame shows a maximize/restore control when the dialog was
   * opened with `maximizable`; a bare dialog draws its own control and calls this directly.
   */
  toggleMaximized(): void {
    this.maximizedState.update((value) => !value);
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
