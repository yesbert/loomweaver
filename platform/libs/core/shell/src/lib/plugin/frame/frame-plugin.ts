import { InjectionToken } from '@angular/core';
import { Capability } from '@loomweaver/plugin-sdk';
import { PluginIsolationLevel } from '../../foundation/plugin-isolation-level';

/**
 * A **sandboxed** plugin a distribution registers: its code is not an in-process
 * {@link Plugin} object but a URL to an isolated document, loaded into an `<iframe sandbox>` and given
 * `ctx` over RPC. Contrast {@link providePlugins} (trusted, in-process).
 */
export interface FramePlugin {
  /** Stable plugin id — the same id the distribution grants capabilities to (default-deny). */
  readonly id: string;
  /**
   * What the workbench calls this plugin where it names it to the user — the permissions surface,
   * the plugin list. Omit it and the id is shown, which is a poor name but a correct one: nothing is
   * derived from it. Grants, collisions and the user's stored decisions all follow {@link id}, never
   * this, so naming a plugin changes what is read and nothing else.
   */
  readonly name?: string;
  /** URL of the plugin's entry document (served by the distribution, e.g. `/my-plugin/plugin.html`). */
  readonly entryUrl: string;
  /** Capabilities the plugin declares it needs; the distribution still has to grant them. */
  readonly capabilities?: readonly Capability[];
  /**
   * Origins this plugin's own surfaces may be served from, beyond the application's own — the seam
   * refuses anything else, and refuses an address that would execute or carry its content inline at
   * any level. Omit it and the application's own origin is the only one, which is the right answer
   * for a plugin whose files the distribution serves itself.
   *
   * A sibling subdomain belongs here: it is what gives an embedded application its own storage and
   * keeps it out of the hosting document, while a session cookie scoped to the shared domain still
   * reaches it.
   */
  readonly origins?: readonly string[];
  /**
   * How much the browser holds this plugin back. Omitted means
   * {@link PluginIsolationLevel `'isolated'`} — the frame is stripped of an origin and reaches
   * neither the hosting document nor any storage. `'embedded'` lets it keep an origin, which is what
   * a first-party application composed for its own deployment needs and what a plugin you did not
   * write must never be given.
   */
  readonly level?: PluginIsolationLevel;
}

/** Multi-provider token: each contribution adds one sandboxed plugin to load. */
export const FRAME_PLUGIN = new InjectionToken<readonly FramePlugin[]>(
  'FRAME_PLUGIN',
);
