import { ErrorHandler, inject, isDevMode, Service, Signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Command, CommandArguments, MenuContext } from '@loomweaver/plugin-sdk';
import { isPopoutUrl } from '../popout/popout-path';
import { ContributionRegistry } from '../plugin/contribution-registry';
import { AuthContext } from '../auth/auth-context';
import { SHELL_FEATURES } from '../foundation/shell-features';
import { formatChord } from './format-chord';

interface Triggerable {
  readonly command?: string;
  run?(): void | Promise<void>;
}

/**
 * Executes commands by id — the single seam every trigger flows through:
 * rail/bar/view-action items, and (next) keybindings and the command palette. Keeping execution
 * here (not on the registry, which only stores) means one place resolves an id, one place fires the
 * behaviour, and one place reports a failure.
 */
@Service()
export class CommandService {
  private readonly registry = inject(ContributionRegistry);
  private readonly auth = inject(AuthContext);
  private readonly errors = inject(ErrorHandler);
  private readonly shortcuts = inject(SHELL_FEATURES).commands.shortcuts;
  private readonly inPopout = isPopoutUrl(inject(DOCUMENT).location.pathname);

  /** The registered commands — the source list for a command palette. */
  readonly commands: Signal<readonly Command[]> = this.registry.commands;

  /**
   * Whether this command can run **here and now**: the session meets its `access`, and
   * this window is one it belongs in — a pop-out offers only commands that declare `popout`, since it
   * has no content area, rail or sidebar for the rest to reach. A palette uses this to filter.
   */
  available(command: Command): boolean {
    if (this.inPopout && command.popout !== true) {
      return false;
    }
    return this.auth.meets(command.access);
  }

  /**
   * The command's keyboard chord, formatted for display and OS-correct (`'⌘K'` / `'Ctrl+K'`), or
   * `undefined` where it has none — **or where this distribution has switched shortcuts off**, so a
   * hint never promises a key that does nothing. Every place the shell prints a chord (menu entry,
   * palette row, bar button) asks here.
   */
  shortcutOf(command: Command | undefined): string | undefined {
    if (!command?.shortcut || !this.shortcuts) {
      return undefined;
    }
    return formatChord(command.shortcut);
  }

  /**
   * Runs the command with this id; a no-op (with a warning) if none is registered. Blocks — the one
   * choke point every trigger flows through (keybinding, palette, item) — when the session does not
   * meet the command's `access`. An optional {@link MenuContext} is forwarded to
   * `command.run(context)` — how a menu tells `shell.tab.closeOthers` which tab.
   */
  execute(id: string, context?: MenuContext): void {
    const command = this.commands().find((c) => c.id === id);
    if (!command) {
      console.warn(`Command "${id}" is not registered.`);
      return;
    }
    if (!this.available(command)) {
      if (isDevMode()) {
        console.warn(
          this.inPopout && command.popout !== true
            ? `Command "${id}" blocked: this is a pop-out window, which offers only commands that ` +
                `declare popout: true.`
            : `Command "${id}" blocked: the session does not meet its access requirement.`,
        );
      }
      return;
    }
    void this.run(command, context).catch(() => undefined);
  }

  /**
   * Fires a resolved command's behaviour — the one place that happens, whatever triggered it — and
   * reports a failure the way every trigger already does. Answers what the command returned, and
   * rejects with what it threw, so a caller that has to tell a failure from an answer can.
   */
  async run(
    command: Command,
    context?: MenuContext,
    args?: CommandArguments,
  ): Promise<unknown> {
    try {
      return await command.run(context, args);
    } catch (error) {
      this.onError(error);
      throw error;
    }
  }

  /**
   * Whether this item's trigger leads anywhere: an inline callback, or a command that is actually
   * registered. A rail or bar item naming a command nobody registered would render as a dead button
   * — the same orphan a menu entry can be, and the host drops both rather than draw them.
   */
  triggerable(item: Triggerable): boolean {
    return item.command
      ? this.commands().some((command) => command.id === item.command)
      : item.run !== undefined;
  }

  /** Fires a UI item's trigger: its bound command if it names one, else its inline callback. */
  trigger(item: Triggerable): void {
    if (item.command) {
      this.execute(item.command);
      return;
    }
    const run = item.run;
    if (run) {
      this.invoke(run);
    }
  }

  private invoke(run: () => unknown): void {
    try {
      const result: unknown = run();
      if (result instanceof Promise) {
        result.catch((error: unknown) => this.onError(error));
      }
    } catch (error) {
      this.onError(error);
    }
  }

  private onError(error: unknown): void {
    this.errors.handleError(error);
  }
}
