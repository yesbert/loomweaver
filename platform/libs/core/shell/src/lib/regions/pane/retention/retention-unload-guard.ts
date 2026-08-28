import { DOCUMENT } from '@angular/common';
import { inject, OnDestroy, Service } from '@angular/core';
import { isPopoutUrl } from '../../../popout/popout-path';
import { RetentionCandidates } from './retention-candidates';
import { instanceDirty } from './retention-policy';

@Service()
export class RetentionUnloadGuard implements OnDestroy {
  private readonly candidates = inject(RetentionCandidates);
  private readonly document = inject(DOCUMENT);
  private readonly popout = isPopoutUrl(
    inject(DOCUMENT).location?.pathname ?? '',
  );
  private started = false;
  private suppressed = false;

  start(): void {
    if (this.started || this.popout) {
      return;
    }
    this.started = true;
    this.document.defaultView?.addEventListener(
      'beforeunload',
      this.onBeforeUnload,
    );
  }

  suppress(): void {
    this.suppressed = true;
  }

  ngOnDestroy(): void {
    this.document.defaultView?.removeEventListener(
      'beforeunload',
      this.onBeforeUnload,
    );
  }

  private readonly onBeforeUnload = (event: BeforeUnloadEvent): void => {
    if (this.suppressed) {
      return;
    }
    const dirty = this.candidates
      .all()
      .some((instance) => instanceDirty(instance));
    if (!dirty) {
      return;
    }
    event.preventDefault();
    event.returnValue = '';
  };
}
