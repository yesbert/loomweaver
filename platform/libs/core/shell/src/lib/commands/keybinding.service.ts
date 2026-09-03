import { DOCUMENT } from '@angular/common';
import { computed, DestroyRef, effect, inject, Injector, Service, Signal } from '@angular/core';
import { Command } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../plugin/contribution-registry';
import { CommandService } from './command.service';
import {
  chordSignature,
  eventSignature,
  isEditableTarget,
  isMacPlatform,
} from './keybinding';
import { FeatureSwitches } from '../features/feature-switches.service';

interface BindingsBuild {
  readonly map: ReadonlyMap<string, string>;
  readonly warnings: readonly string[];
}

function buildBindings(
  commands: readonly Command[],
  isMac: boolean,
): BindingsBuild {
  const map = new Map<string, string>();
  const warnings: string[] = [];
  for (const command of commands) {
    if (!command.shortcut) {
      continue;
    }
    const signature = chordSignature(command.shortcut, isMac);
    if (!signature) {
      warnings.push(
        `Command "${command.id}" has an unparsable shortcut "${command.shortcut}".`,
      );
      continue;
    }
    const clash = map.get(signature);
    if (clash) {
      warnings.push(
        `Shortcut "${command.shortcut}" is bound to both "${clash}" and "${command.id}".`,
      );
    }
    map.set(signature, command.id);
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
    buildBindings(this.registry.commands(), this.isMac),
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
