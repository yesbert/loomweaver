import { effect, inject, Injector, Service, Signal, untracked } from '@angular/core';
import { AuthSnapshot } from '@loomweaver/plugin-sdk';
import { RetentionUnloadGuard } from '../regions/pane/retention/retention-unload-guard';

@Service()
export class IdentityChangeReload {
  private readonly injector = inject(Injector);
  private readonly unloadGuard = inject(RetentionUnloadGuard);
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
            this.reload();
          });
          return;
        }
        this.lastSubject = subject;
      },
      { injector: this.injector },
    );
  }

  protected reload(): void {
    location.reload();
  }
}
