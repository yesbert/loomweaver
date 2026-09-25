import { computed, Service, signal } from '@angular/core';
import { APP_VERSION } from './app-version';
import { isPreviewVersion } from './preview-version';

/**
 * The version the workbench shows: the released version of `@loomweaver/shell` until the
 * distribution points it at its own build with `version.set(…)`, which every reader follows.
 *
 * Distributions and plugins render it through `<lw-version>` or `ctx.host.version`, never
 * hardcoded.
 */
@Service()
export class VersionService {
  /** The version shown, e.g. `0.1.0`; set it to point at your own build. */
  readonly version = signal<string>(APP_VERSION);

  /**
   * Whether {@link version} is a preview of a line that has not been released — `0.8.0-preview.3`
   * rather than `0.7.9`. Ask this instead of taking the version apart yourself.
   *
   * **Announcing it is yours.** The workbench marks a preview nowhere on its own: how loudly a
   * product tells its users that it is running something unfinished is the product's judgement.
   * A distribution that wants it visible draws it, from this.
   */
  readonly isPreview = computed(() => isPreviewVersion(this.version()));
}
