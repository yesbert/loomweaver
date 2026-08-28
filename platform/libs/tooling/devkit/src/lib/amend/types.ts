/**
 * What generated output needs from the workspace around it, stated as data so that every route can
 * apply it with whatever it has: a filesystem, an Nx tree, or nothing but words.
 *
 * Every amendment is an "ensure this is present", never a "set this to". Applying one twice changes
 * nothing, and a value the consumer already chose always wins.
 */
export type Amendment =
  | PostcssAmendment
  | BuildTargetAmendment
  | StylesheetSourceAmendment
  | ComposePluginAmendment;

/**
 * An entry in a build target's `assets` array. Where the input is resolved from differs per entry
 * and cannot be guessed: the project's own folder is named relative to the project, an installed
 * package relative to the workspace.
 */
export interface AssetGlob {
  readonly glob: string;
  readonly input: string;
  readonly from: 'project' | 'workspace';
  readonly output?: string;
}

/**
 * The style pipeline the generated stylesheet needs. Without it the stylesheet is read as plain CSS,
 * which emits no utility class at all and leaves the workbench unstyled without failing the build.
 */
export interface PostcssAmendment {
  readonly kind: 'postcss';
  /** Resolved against the workspace root, not the generated project. */
  readonly file: '.postcssrc.json';
  readonly plugin: string;
}

/** What the application's build target needs so the generated product runs as it was built. */
export interface BuildTargetAmendment {
  readonly kind: 'build-target';
  /** Project-relative, because a build target names its stylesheet the way its workspace does. */
  readonly styles: readonly string[];
  readonly assets: readonly AssetGlob[];
  readonly serviceWorker?: string;
  /**
   * False here is not a preference. The generated document ships a strict `script-src 'self'`, and
   * the critical-CSS pass loads the stylesheet with an inline `onload` that the policy blocks, so a
   * release build renders completely unstyled while reporting success.
   */
  readonly inlineCritical?: boolean;
}

/** A source directory the entry stylesheet must name, or its utilities are never emitted. */
export interface StylesheetSourceAmendment {
  readonly kind: 'stylesheet-source';
  /**
   * Workspace-relative, because only the route applying this knows where the entry stylesheet sits,
   * and `@source` is resolved from that stylesheet rather than from the workspace root.
   */
  readonly sourceRoot: string;
}

/**
 * A generated plugin the distribution must register, or none of its contributions ever appear. The
 * receiving file is generated too, which is the only reason composing into it is safe: where it no
 * longer presents that shape, the route names these lines instead of guessing at the consumer's code.
 */
export interface ComposePluginAmendment {
  readonly kind: 'compose-plugin';
  readonly id: string;
  /** The symbol the plugin's own entry point exports. */
  readonly symbol: string;
  /** Exactly what the plugin's manifest declares; the broker is default-deny. */
  readonly capabilities: readonly string[];
  /** Workspace-relative, because only the applying route knows where the composition root sits. */
  readonly sourceRoot: string;
}
