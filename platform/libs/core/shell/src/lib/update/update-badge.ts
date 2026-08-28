import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { UpdateService } from './update.service';

/**
 * Persistent update affordance for a bar. While no update is pending it is a
 * quiet "check for updates" button; once the service worker has a new version ready it
 * gains a badge dot and becomes "reload to update". When installing an update failed it gains a
 * caution dot and offers a reload instead of pretending to be current; when the worker's cache is
 * broken outright it says so and offers the repair. Reads {@link UpdateService}, so the badge
 * survives dismissing the toast. Renders nothing when updates are unavailable
 * (no service worker — dev/unsupported).
 */
@Component({
  selector: 'lw-update-badge',
  imports: [TranslocoPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './update-badge.html',
})
export class UpdateBadge {
  private readonly updates = inject(UpdateService);

  protected readonly enabled = this.updates.enabled;
  protected readonly available = this.updates.updateAvailable;
  protected readonly failed = this.updates.updateFailed;
  protected readonly label = computed(() => {
    if (this.available()) {
      return 'update.available';
    }
    if (this.updates.updateBroken()) {
      return 'update.broken';
    }
    return this.failed() ? 'update.failed' : 'update.check';
  });

  protected onClick(): void {
    if (this.available() || this.failed()) {
      void this.updates.activateUpdate();
    } else {
      void this.updates.checkForUpdate();
    }
  }
}
