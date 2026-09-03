import { computed, inject, Service, Signal, signal } from '@angular/core';
import { mergeShellFeatures } from '../foundation/merge-shell-features';
import {
  SHELL_FEATURES,
  ShellFeatures,
  ShellFeaturesInput,
} from '../foundation/shell-features';

/** One read-only signal per switch of a group, under the switch's own name. */
export type SwitchSignals<Group> = {
  readonly [Switch in keyof Group]: Signal<boolean>;
};

/**
 * The current state of every shell capability switch, readable as signals and changeable while the
 * application runs. What `provideShellFeatures` declares is the starting value; `update` changes
 * switches from there, naming only what changes, in the same shape the declaration uses:
 *
 * ```ts
 * const switches = inject(FeatureSwitches);
 * switches.content.splitRight();                       // Signal<boolean>, true by default
 * switches.update({ content: { splitRight: false } }); // the button, drop edges and mod+\ go
 * ```
 *
 * A switch removes the user's routes, not the capability: what a distribution switches off, its own
 * code still reaches through the services that carry it. Switching off acts forward only, so a pane
 * that was split stays split; put the state where you want it before taking the way away. Nothing
 * here is persisted, and the next start begins from the declaration again; whether a change made
 * at runtime survives, and for whom, is the distribution's decision, made with its own stores.
 */
@Service()
export class FeatureSwitches {
  private readonly state = signal<ShellFeatures>(inject(SHELL_FEATURES));

  /** The whole set as it stands now. */
  readonly current: Signal<ShellFeatures> = this.state.asReadonly();
  /** Gestures of the content area, one signal per switch. */
  readonly content = this.group('content');
  /** Gestures of the side panels, one signal per switch. */
  readonly sidebar = this.group('sidebar');
  /** Gestures of the rail, one signal per switch. */
  readonly rail = this.group('rail');
  /** The workspace switches, one signal each. */
  readonly workspaces = this.group('workspaces');
  /** The detached-window switch. */
  readonly windows = this.group('windows');
  /** How commands reach the user, one signal per switch. */
  readonly commands = this.group('commands');

  /**
   * Changes switches while the application runs. Fields merge group by group, so naming one switch
   * leaves its neighbours alone. Every reader of the affected switches re-evaluates.
   */
  update(input: ShellFeaturesInput): void {
    this.state.update((current) => mergeShellFeatures(current, input));
  }

  private group<Group extends keyof ShellFeatures>(
    name: Group,
  ): SwitchSignals<ShellFeatures[Group]> {
    const keys = Object.keys(
      this.state()[name],
    ) as (keyof ShellFeatures[Group] & string)[];
    const signals = keys.map((key) => [
      key,
      computed(() => this.state()[name][key] as boolean),
    ]);
    return Object.fromEntries(signals) as SwitchSignals<ShellFeatures[Group]>;
  }
}
