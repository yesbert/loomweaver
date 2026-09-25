import { Capability } from './capability.js';
import { PluginContext } from './plugin-context.js';

/** What a plugin declares about itself: its id, its name and the capabilities it needs. */
export interface PluginManifest {
  /** Stable plugin id. */
  readonly id: string;
  /** Human-readable name. */
  readonly name?: string;
  /**
   * Capabilities the plugin declares it needs. This is the *request*; the
   * distribution/tenant *grants* (default-deny, see `provideCapabilityGrants`). The effective set
   * is what was granted — a declaration alone grants nothing. The declaration is what the install
   * consent dialog shows and what the Permissions settings manage.
   */
  readonly capabilities?: readonly Capability[];
}

/** A LoomWeaver plugin: declares itself and contributes on activation. */
export interface Plugin {
  /** What the plugin declares about itself, read before it is activated. */
  readonly manifest: PluginManifest;
  /** Called once when the plugin starts; contribute through `ctx` here. */
  activate(ctx: PluginContext): void | Promise<void>;
  /**
   * Called when the plugin stops (disabled, uninstalled or the app is torn down), after the host has
   * removed everything it registered through `ctx`.
   */
  deactivate?(): void;
}
