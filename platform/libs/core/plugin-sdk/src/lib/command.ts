import { AccessRequirement } from './auth.js';
import { MenuContext } from './menu.js';

/** A single value an argument or an answer can carry across any plugin boundary. */
export type CommandScalar = string | number | boolean;

/** What one declared argument may be given: a single value, or a list of them. */
export type CommandArgumentValue = CommandScalar | readonly CommandScalar[];

/** The arguments an invocation supplies, keyed by {@link CommandArgumentBase.name}. */
export type CommandArguments = Readonly<Record<string, CommandArgumentValue>>;

/**
 * What a command may answer with — plain data, because an answer crosses the same boundary its
 * arguments came from and anything else would arrive stripped of what it was.
 */
export type CommandAnswer =
  | CommandScalar
  | null
  | readonly CommandAnswer[]
  | { readonly [key: string]: CommandAnswer };

/** What every declared argument carries, whatever kind of value it takes. */
export interface CommandArgumentBase {
  /** The name the invocation keys this argument by. */
  readonly name: string;
  /**
   * What this argument means, in prose — a Transloco key or a literal. Written for something
   * *choosing* a value, not for a control labelling one, so say what it selects and what a sensible
   * value looks like.
   */
  readonly description: string;
  /** Whether an invocation must supply it. Omit for an optional argument. */
  readonly required?: boolean;
  /** Take a list of this kind rather than a single value. Omit for a single value. */
  readonly list?: boolean;
}

/** An argument taking a free value of one of the three plain kinds. */
export interface SimpleCommandArgument extends CommandArgumentBase {
  readonly kind: 'text' | 'number' | 'boolean';
}

/** An argument taking one of a fixed set of strings. */
export interface ChoiceCommandArgument extends CommandArgumentBase {
  readonly kind: 'choice';
  /** The values this argument accepts; anything else is refused before the command runs. */
  readonly choices: readonly string[];
}

/**
 * One argument a command accepts. The set of kinds is closed on purpose: a caller has to be able to
 * describe a command to something that has never seen it, and a closed set makes a wrong declaration
 * a compile error instead of a silent no-op. Widening it later is additive; narrowing it would not be.
 */
export type CommandArgument = SimpleCommandArgument | ChoiceCommandArgument;

/**
 * Why an invocation was refused. A refusal is not a failure: the command did not run.
 *
 * `unavailable` is deliberately one answer for several situations — no such command, not open to a
 * foreign caller, the session does not meet its access requirement, the window does not host it, the
 * calling plugin was not granted the capability. Telling them apart would let a caller map what is
 * installed by invoking ids and reading the reason back.
 */
export type CommandRefusalReason =
  | 'unavailable'
  | 'invalid-arguments'
  | 'too-deep';

/** The command ran; `value` is present where the command declares {@link Command.answers}. */
export interface CommandAnswered {
  readonly outcome: 'answered';
  readonly value?: CommandAnswer;
}

/** The command did not run. */
export interface CommandRefused {
  readonly outcome: 'refused';
  readonly reason: CommandRefusalReason;
  /** A developer-facing explanation; never the place to show a user a message. */
  readonly message: string;
}

/** The command ran and threw, or its asynchronous work rejected. */
export interface CommandFailed {
  readonly outcome: 'failed';
  readonly message: string;
}

/**
 * What an invocation answers with. The three cases are distinct because a caller has to tell
 * "you may not" from "it broke" from "here is your answer", and none of the three may be presented
 * as either of the others.
 */
export type CommandOutcome = CommandAnswered | CommandRefused | CommandFailed;

/**
 * A command as offered to a caller that may invoke it — the workbench's own account of what it can
 * be asked to do. Every text is already resolved to the active language, because a caller outside the
 * application cannot reach the translation bundles and a raw key would be useless to it.
 */
export interface InvocableCommand {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly arguments?: readonly CommandArgument[];
  readonly answers?: string;
}

/**
 * A named, invocable action.
 * A command is the stable anchor that a keybinding, a command-palette entry, and a UI item
 * (rail/bar/view-action/menu) all point at by {@link Command.id}: one behaviour, many triggers.
 *
 * Register via `ctx.registerCommand(...)`; a UI item references it with `command: <id>` instead
 * of carrying its own inline `run()`.
 */
export interface Command {
  /** Stable, namespaced id (e.g. "testbed.reset") — what triggers reference. */
  readonly id: string;
  /** Transloco key (or literal) for the command's label (command palette, menus). */
  readonly title: string;
  /** Optional icon name — resolved by the host icon registry (a plain string). */
  readonly icon?: string;
  /**
   * Optional default keyboard shortcut — a chord like `"mod+enter"` or `"mod+shift+p"`. Tokens are
   * case-insensitive and `+`-joined: modifiers `mod` (⌘ on macOS, Ctrl elsewhere), `ctrl`, `meta`/
   * `cmd`, `alt`/`option`, `shift`, then one key (`k`, `enter`, `escape`, …). The host binds it; user
   * rebinding is deferred.
   */
  readonly shortcut?: string;
  /**
   * Declarative auth gating: the host **blocks** this command when the current session
   * does not meet the requirement — every trigger flows through one seam, so the keybinding no-ops,
   * the command palette omits it, and a UI item bound to it does nothing. A command is invocable or
   * not, so `mode` is ignored here. Presentation only — real enforcement is server-side. Omit for a
   * command everyone can run.
   */
  readonly access?: AccessRequirement;
  /**
   * Hide this command from the command palette. Set it on a **context-only** command — one whose
   * {@link Command.run} needs a {@link MenuContext} (a tab or view id) that only a menu supplies, so
   * the palette (which invokes with no context) could offer nothing but a no-op. Menu items and
   * keybindings still invoke it normally. Omit for a command the palette should list.
   */
  readonly paletteHidden?: boolean;
  /**
   * Offer this command in a **pop-out window** as well. Commands are main-window-only by
   * default: a pop-out shows exactly one surface, with no tab strip, rail or sidebar, and is a viewer
   * onto that surface rather than half the application. Without this flag the palette omits the
   * command there, its keybinding no-ops and a UI item bound to it does nothing — the same one seam
   * `access` flows through.
   *
   * The default is the quiet one on purpose: a command *missing* from a pop-out is a small
   * annoyance, while one that does something surprising in a detached window is the larger failure,
   * and the shell cannot tell the two apart for a command it did not write.
   *
   * Set it on what genuinely belongs beside a single surface — an about dialog, a theme toggle, an
   * action on the surface's own data. Leave it off for anything that reaches for chrome a pop-out
   * does not have: navigating the content area (which the shell refuses there anyway, since it would
   * take the window out of its `/popout/…` address), opening or revealing a tab, focusing a docked
   * view, changing the layout.
   */
  readonly popout?: boolean;
  /**
   * What this command *does*, in prose — a Transloco key or a literal. Distinct from
   * {@link Command.title}, which labels a control: a title is read beside an icon by someone who can
   * already see where they are, a description is read by something deciding between actions it has
   * never seen. Omit it and the command has none; the title is never substituted, because a label is
   * not an explanation.
   *
   * A command that sets {@link Command.callable} without one is unusable to the very caller it opened
   * itself to, and the manifest validator says so.
   */
  readonly description?: string;
  /**
   * The arguments this command accepts. The host checks an invocation against them before the
   * command runs — a missing required argument, a value of the wrong kind, or a choice outside the
   * declared set is refused rather than reaching `run`. That check is for discovery, not for safety:
   * validate your own inputs as you would without it.
   */
  readonly arguments?: readonly CommandArgument[];
  /**
   * What this command answers with, in prose — a Transloco key or a literal. Declaring it is what
   * makes {@link Command.run}'s return value the invocation's answer; without it an invocation
   * succeeds carrying nothing, whatever `run` happened to return.
   */
  readonly answers?: string;
  /**
   * Let a caller **other than this plugin** invoke this command by its id. Omitted, it cannot be
   * reached that way by any route and is absent from everything that lists what such a caller may
   * run; the plugin that registered it always reaches its own regardless.
   *
   * The default is the quiet one on purpose, exactly as {@link Command.popout} is: a command
   * *missing* from what an automated caller can reach is a small annoyance, while one that does
   * something surprising because something other than the user triggered it is the larger failure,
   * and the shell cannot tell the two apart for a command it did not write.
   *
   * Opening a command widens nothing else. It still runs only where its {@link Command.access}, its
   * {@link Command.popout} declaration and the caller's own granted capabilities already allow, so a
   * caller can never reach through it to something the user could not have triggered themselves.
   */
  readonly callable?: boolean;
  /**
   * The behaviour. May be async; the host fires it and reports a failure rather than throwing.
   * The return type is `unknown` so that a one-expression arrow handler still assigns whatever it
   * returns; the host passes a value back to a caller only where {@link Command.answers} is declared,
   * and only where the value is plain data.
   *
   * Receives an optional {@link MenuContext} when invoked from a menu — e.g. the tab context
   * menu passes `{ tabId, … }` so `shell.tab.closeOthers` knows which tab. Triggers without a context
   * (keybinding, palette, rail/bar item) call it with none; `run()` and `run(context)` are both valid.
   *
   * `args` holds what an invocation by id supplied, already checked against
   * {@link Command.arguments}. A trigger the user drove supplies none.
   */
  run(context?: MenuContext, args?: CommandArguments): unknown;
}
