import { CommandArgument, CommandArguments } from './command-arguments.js';
import { MenuContext } from '../chrome/menu.js';
import { AccessRequirement } from '../plugin/auth.js';

/**
 * How much an agent may do with a command without asking the user.
 *
 * - `allow` — the agent's word is enough; consent is given in advance.
 * - `ask` — the user is asked first.
 * - `ask-always` — the user is asked every time it is called, with no standing yes.
 * - `never` — it is not to be run on an agent's word at all.
 */
export type AgentConsent = 'allow' | 'ask' | 'ask-always' | 'never';

/**
 * A named, invocable action.
 * A command is the stable anchor that a keybinding, a command-palette entry, and a UI item
 * (rail/bar/view-action/menu) all point at by {@link Command.id}: one behaviour, many triggers.
 *
 * Register via `ctx.registerCommand(...)`; a UI item references it with `command: <id>` instead
 * of carrying its own inline `run()`.
 */
export interface Command {
  /** Stable, namespaced id (e.g. "reports.refresh") — what triggers reference. */
  readonly id: string;
  /** Transloco key (or literal) for the command's label (command palette, menus). */
  readonly title: string;
  /** Optional icon name — resolved by the host icon registry (a plain string). */
  readonly icon?: string;
  /**
   * Optional default keyboard shortcut — a chord like `"mod+enter"` or `"mod+shift+p"`. Tokens are
   * case-insensitive and `+`-joined: modifiers `mod` (⌘ on macOS, Ctrl elsewhere), `ctrl`, `meta`/
   * `cmd`, `alt`/`option`, `shift`, then one key (`k`, `enter`, `escape`, …). The host binds it; a
   * user cannot rebind it.
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
   * Offers this command in a **pop-out window** as well. Commands are main-window-only by default:
   * without this flag the palette omits the command there, and its keybinding and any UI item bound
   * to it do nothing.
   *
   * Set it on what belongs beside a single surface: an about dialog, a theme toggle, an action on the
   * surface's own data. Leave it off for anything that needs chrome a pop-out does not have, such as
   * navigating the content area, opening or revealing a tab, or changing the layout.
   */
  readonly popout?: boolean;
  /**
   * What this command *does*, in prose — a Transloco key or a literal. Distinct from
   * {@link Command.title}, which labels a control: a title is read beside an icon by someone who can
   * already see where they are, a description is read by something deciding between actions it has
   * never seen. Omit it and the command has none; the title is never substituted, because a label is
   * not an explanation.
   *
   * A command that sets {@link Command.callable} without one gives the caller it is callable for
   * nothing to go on but an id, and the manifest validator says so.
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
   * Lets a caller **other than this plugin** invoke this command by its id. Omitted, no such caller
   * reaches it by any route, and it is absent from every list of what such a caller may run; the
   * plugin that registered it always reaches its own.
   *
   * It widens nothing else: the command still runs only where its {@link Command.access}, its
   * {@link Command.popout} and the caller's granted capabilities allow, so a caller never reaches
   * through it to something the user could not have triggered.
   */
  readonly callable?: boolean;
  /**
   * How much an agent may do with this command without asking the user: carried out, the user asked
   * first, the user asked every time, or not on an agent's word at all. Omit it and the command says
   * nothing, which is the default.
   *
   * **A statement, not a gate**: the platform asks nobody and refuses nothing on this account; asking
   * belongs to whoever runs commands for an agent. It travels with the command, in
   * {@link InvocableCommand} and in any description written for an agent. To put a command beyond an
   * agent's reach, leave {@link Command.callable} off, which the platform enforces for every caller
   * but this plugin.
   */
  readonly agentConsent?: AgentConsent;
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
