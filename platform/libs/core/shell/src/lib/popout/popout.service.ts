import { DOCUMENT } from '@angular/common';
import { inject, Service } from '@angular/core';
import { DialogService } from '../dialog/dialog.service';
import { popoutUrlFor } from './popout-path';
import { PopoutWindow } from './popout-window';

/**
 * Opening a surface in its own browser window, and knowing whether this window **is** one.
 *
 * A pop-out boots the same app from a `/popout/…` URL and renders exactly one surface — no rail, no
 * sidebars, no pane tree — so the main window stays the only writer of the layout keys. The mode is
 * read from the location once at startup: a pop-out never becomes a main window, and the shell needs
 * the answer before it renders anything.
 */
@Service()
export class PopoutService {
  /** Whether this browser window is a pop-out. Fixed for the window's lifetime. */
  readonly active = inject(PopoutWindow).active;

  private readonly document = inject(DOCUMENT);
  private readonly dialogs = inject(DialogService);

  /**
   * Opens `paneTarget` — a `view:<viewId>` descriptor or a content-route path — in a new browser
   * window. The tab it came from **stays** where it is: this duplicates, it does not move. If the
   * pop-up blocker swallows the window, the user gets a dialog whose button is a fresh gesture that
   * practically always gets through.
   */
  open(paneTarget: string): void {
    if (!this.tryOpen(paneTarget)) {
      void this.offerToOpenAgain(paneTarget);
    }
  }

  private async offerToOpenAgain(paneTarget: string): Promise<void> {
    const retry = await this.dialogs.confirm({
      title: 'popout.blocked.title',
      message: 'popout.blocked.message',
      confirmLabel: 'popout.blocked.open',
    });
    if (retry) {
      this.tryOpen(paneTarget);
    }
  }

  private tryOpen(paneTarget: string): boolean {
    const opened = this.document.defaultView?.open(
      popoutUrlFor(paneTarget),
      '_blank',
    );
    return opened != null;
  }
}
