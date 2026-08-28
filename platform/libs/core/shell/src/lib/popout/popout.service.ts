import { DOCUMENT } from '@angular/common';
import { inject, Service } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { DialogService } from '../dialog/dialog.service';
import { isPopoutUrl, popoutUrlFor } from './popout-path';

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
  readonly active: boolean;

  private readonly document = inject(DOCUMENT);
  private readonly dialogs = inject(DialogService);
  private readonly transloco = inject(TranslocoService);

  constructor() {
    this.active = isPopoutUrl(this.document.location?.pathname ?? '');
  }

  /**
   * Opens `paneTarget` — a `view:<viewId>` descriptor or a content-route path — in a new browser
   * window. The tab it came from **stays** where it is: this duplicates, it does not move. If the
   * pop-up blocker swallows the window, the user gets a dialog whose button is a fresh gesture that
   * practically always gets through.
   */
  open(paneTarget: string): void {
    if (this.tryOpen(paneTarget)) {
      return;
    }
    void this.dialogs
      .confirm({
        title: this.transloco.translate('popout.blocked.title'),
        message: this.transloco.translate('popout.blocked.message'),
        confirmLabel: this.transloco.translate('popout.blocked.open'),
      })
      .then((retry) => retry && this.tryOpen(paneTarget));
  }

  private tryOpen(paneTarget: string): boolean {
    const opened = this.document.defaultView?.open(
      popoutUrlFor(paneTarget),
      '_blank',
    );
    return opened != null;
  }
}
