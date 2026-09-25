import { DOCUMENT } from '@angular/common';
import {
  computed,
  DestroyRef,
  effect,
  inject,
  Injector,
  Service,
  Signal,
} from '@angular/core';
import { Command } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { CommandService } from '../command.service';
import {
  chordClaims,
  eventSignature,
  isEditableTarget,
  isMacPlatform,
} from './chord';
import { FeatureSwitches } from '../../features/feature-switches.service';

interface ChordBindings {
  readonly map: ReadonlyMap<string, string>;
  readonly warnings: readonly string[];
}

function bindChords(
  commands: readonly Command[],
  isMac: boolean,
): ChordBindings {
  const { bySignature, unparsable } = chordClaims(commands, isMac);
  const map = new Map<string, string>();
  const warnings = unparsable.map(
    (command) =>
      `Command "${command.id}" has an unparsable shortcut "${command.shortcut}".`,
  );
  for (const [signature, claimants] of bySignature) {
    map.set(signature, (claimants.at(-1) as Command).id);
    for (const [index, command] of claimants.entries()) {
      if (index > 0) {
        warnings.push(
          `Shortcut "${command.shortcut}" is bound to both "${claimants[index - 1].id}" and "${command.id}".`,
        );
      }
    }
  }
  return { map, warnings };
}

/**
 * Binds command shortcuts to the keyboard. Bindings are *derived* from the registered
 * commands' `shortcut` (no separate registration path) and rebuild reactively as commands come and
 * go. One global `keydown` listener resolves the pressed chord to a command id and fires it through
 * the {@link CommandService} — the same seam a click uses. User rebinding is deferred.
 */
@Service()
export class KeybindingService {
  private readonly registry = inject(ContributionRegistry);
  private readonly commands = inject(CommandService);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly enabled = inject(FeatureSwitches).commands.shortcuts;
  private readonly isMac = isMacPlatform();
  private started = false;

  private readonly build = computed(() =>
    bindChords(this.registry.commands(), this.isMac),
  );

  private readonly bindings: Signal<ReadonlyMap<string, string>> = computed(
    () => this.build().map,
  );

  /** Attaches the global listener once; auto-detached on destroy. A chord is ignored while shortcuts are off. */
  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    effect(
      () => {
        for (const warning of this.build().warnings) {
          console.warn(warning);
        }
      },
      { injector: this.injector },
    );
    const handler = (event: KeyboardEvent) => this.onKeydown(event);
    this.document.addEventListener('keydown', handler);
    this.destroyRef.onDestroy(() =>
      this.document.removeEventListener('keydown', handler),
    );
  }

  private onKeydown(event: KeyboardEvent): void {
    if (!this.enabled()) {
      return;
    }
    const hasCommandModifier = event.ctrlKey || event.metaKey || event.altKey;
    if (!hasCommandModifier && isEditableTarget(event.target)) {
      return;
    }
    const commandId = this.bindings().get(eventSignature(event));
    if (!commandId) {
      return;
    }
    event.preventDefault();
    this.commands.execute(commandId);
  }
}
