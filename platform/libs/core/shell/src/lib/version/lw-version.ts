import { Component, ViewEncapsulation, computed, inject, input } from '@angular/core';
import { VersionService } from './version.service';

/**
 * Displays the running build's version, e.g. `v0.1.0`. A neutral host-offered widget
 * any distribution or plugin can embed (status bar, about dialog, …); the number comes
 * from {@link VersionService}, never hardcoded.
 *
 *   <lw-version />          → v0.1.0
 *   <lw-version prefix="" /> → 0.1.0
 */
@Component({
  selector: 'lw-version',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './lw-version.html',
})
export class LwVersion {
  private readonly versions = inject(VersionService);

  /** Text shown before the number; set to `''` to hide. */
  readonly prefix = input('v');

  protected readonly label = computed(
    () => `${this.prefix()}${this.versions.version()}`,
  );
}
