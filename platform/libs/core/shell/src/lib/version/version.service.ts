import { Service, signal } from '@angular/core';
import { APP_VERSION } from './app-version';

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
}
