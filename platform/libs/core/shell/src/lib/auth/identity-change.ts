import {
  effect,
  inject,
  Injector,
  Service,
  Signal,
  untracked,
} from '@angular/core';
import { AuthSnapshot } from '@loomweaver/plugin-sdk';
import { RetentionUnloadGuard } from '../regions/pane/unsaved-work/retention-unload-guard';
import { ServedBase } from '../foundation/served-base';
import { PopoutWindow } from '../popout/popout-window';

@Service()
export class IdentityChangeReload {
  private readonly injector = inject(Injector);
  private readonly unloadGuard = inject(RetentionUnloadGuard);
  private readonly base = inject(ServedBase);
  private readonly popout = inject(PopoutWindow);
  private lastSubject: string | null = null;
  private started = false;

  start(source: Signal<AuthSnapshot>): void {
    if (this.started) {
      return;
    }
    this.started = true;
    effect(
      () => {
        const subject = source().subject ?? null;
        if (subject === null) {
          return;
        }
        if (this.lastSubject !== null && this.lastSubject !== subject) {
          untracked(() => {
            this.unloadGuard.suppress();
            this.leave();
          });
          return;
        }
        this.lastSubject = subject;
      },
      { injector: this.injector },
    );
  }

  protected closeWindow(): boolean {
    window.close();
    return window.closed;
  }

  protected openAt(url: string): void {
    location.replace(url);
  }

  private leave(): void {
    if (this.popout.active && this.closeWindow()) {
      return;
    }
    this.openAt(this.base.path);
  }
}
