import { computed, Service, signal } from '@angular/core';
import { APP_VERSION } from './app-version';
import { isPreviewVersion } from './preview-version';

/**
 * The running build's version, sourced from `<Version>` in Directory.Build.props
 * at build time (see tools/stamp-version.mjs). Exposed as a signal so a
 * later source (e.g. a product backend) can update it live without touching consumers.
 *
 * Neutral core chrome: the version is host-offered data; distributions and plugins
 * render it via `<lw-version>` or `ctx`, never hardcoded.
 */
@Service()
export class VersionService {
  /** SemVer of the running build, e.g. `0.1.0`. */
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
