import { Component, computed, inject, input } from '@angular/core';
import { LayoutRegion } from '../../layout/layout';
import { BarItem, BarSlot } from '../../foundation/bar-item';
import { ShellBarItem } from './shell-bar-item';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { AuthContext } from '../../auth/auth-context';
import { CommandService } from '../../commands/command.service';

@Component({
  selector: 'lw-shell-bar',
  imports: [ShellBarItem],
  templateUrl: './shell-bar.html',
})
export class ShellBar {
  readonly region = input.required<LayoutRegion>();

  private readonly registry = inject(ContributionRegistry);
  private readonly auth = inject(AuthContext);
  private readonly commands = inject(CommandService);

  protected readonly startItems = computed(() => this.bySlot('start'));
  protected readonly centerItems = computed(() => this.bySlot('center'));
  protected readonly endItems = computed(() => this.bySlot('end'));
  protected readonly dock = computed(() => this.region().dock);

  protected readonly footer = computed(
    () => this.dock() === 'left' || this.dock() === 'right',
  );

  private bySlot(slot: BarSlot): BarItem[] {
    return this.registry
      .barItems()
      .filter((item) => item.bar === this.region().id && item.slot === slot)
      .filter((item) => this.auth.visible(item.access))
      .filter((item) => 'component' in item || this.commands.triggerable(item))
      .toSorted((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }
}
