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
  | ComposePluginAmendment
  | ComposeProviderAmendment
  | StylesheetImportAmendment
  | PackageAmendment;

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
  /** What is missing while the glob is, where that is not the workbench's own strings. */
  readonly without?: string;
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
  /**
   * The initial-bundle budget, replacing the one a fresh application workspace carries. That
   * default is sized for an empty application, and composing the workbench in spends almost all of
   * it before the consumer writes a line, so a release build stops on a file they never touched.
   * The replacement is set from what the workbench measures and leaves room a product's own growth
   * can still exceed, because a threshold nothing can cross reports nothing.
   */
  readonly initialBudget?: BundleBudget;
}

/** Thresholds for one bundle, in the units a build target states them in. */
export interface BundleBudget {
  readonly warning: string;
  readonly error: string;
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
  /** Provider lines the plugin needs beside its own registration, ensured in the same array. */
  readonly providers?: readonly ProviderLine[];
}

/**
 * One provider line composed beside a plugin, with the imports it needs. A line whose `unless`
 * marker is already in the file is kept as the consumer wrote it and reported, never doubled: in
 * Angular the last provider wins, so a second `provideAuthSource` would silently replace a real one.
 */
export interface ProviderLine {
  /** The line as it goes into the providers array, trailing comma included. */
  readonly line: string;
  /** Symbols the line needs from the shell. */
  readonly shell?: readonly string[];
  /** Symbols the line needs from the plugin's own entry point. */
  readonly own?: readonly string[];
  /** Symbols the line needs from other packages. */
  readonly from?: readonly ImportedSymbols[];
  /** Text whose presence means the file already carries what this line provides. */
  readonly unless?: string;
}

/**
 * Provider lines the composition root must carry for generated code that is not a plugin: a layout,
 * a settings store, a frame plugin's registration. Composed into the same generated providers array
 * as a plugin is, under the same rule: a line whose `unless` marker is already there is kept as the
 * consumer wrote it and named, because replacing what a product chose without being asked is worse
 * than asking.
 */
export interface ComposeProviderAmendment {
  readonly kind: 'compose-provider';
  readonly providers: readonly ProviderLine[];
  /**
   * The generated module the lines' own symbols come from, workspace-relative and without its
   * extension. Absent where the lines need nothing generated.
   */
  readonly module?: string;
  /** What the product lacks while the lines are missing, for a route that can only name them. */
  readonly without: string;
}

/**
 * A generated stylesheet the application's entry stylesheet must import, after the import it names.
 * Without the import the stylesheet is never loaded, so it changes nothing and nothing says so.
 */
export interface StylesheetImportAmendment {
  readonly kind: 'stylesheet-import';
  /** Workspace-relative, because the import is resolved from wherever the entry stylesheet sits. */
  readonly file: string;
  /** The specifier prefix of the import this one must follow. */
  readonly after: string;
  /** What the product lacks while the import is missing. */
  readonly without: string;
}

export interface ImportedSymbols {
  readonly path: string;
  readonly symbols: readonly string[];
}

/**
 * A package the generated files import and the consumer's project may not carry. Stated as a need
 * rather than as a version to set: a route that can reach the workspace records it, a route that
 * cannot names it, and a version the consumer already chose is never overwritten.
 */
export interface PackageAmendment {
  readonly kind: 'package';
  readonly name: string;
  /** The range to record when nothing is recorded yet. */
  readonly version: string;
}
