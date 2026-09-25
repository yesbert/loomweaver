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

/** An argument taking one of a set of strings. */
export interface ChoiceCommandArgument extends CommandArgumentBase {
  readonly kind: 'choice';
  /**
   * The values this argument accepts; anything else is refused before the command runs. For a plugin
   * in the page the list is read whenever the command is described or checked, so a getter can offer
   * values that appear after registration. A sandboxed plugin's list is the one it registered;
   * register the command again to change it.
   */
  readonly choices: readonly string[];
}

/**
 * One argument a command accepts. The set of kinds is closed on purpose: a caller has to be able to
 * describe a command to something that has never seen it, and a closed set makes a wrong declaration
 * a compile error instead of a silent no-op. Widening it later is additive; narrowing it would not be.
 */
export type CommandArgument = SimpleCommandArgument | ChoiceCommandArgument;
