import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, inject, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Command } from '@loomweaver/plugin-sdk';
import { BAR_CONTEXT } from '../../regions/bar/bar-context';
import { CommandService } from '../command.service';

@Component({
  selector: 'lw-search-entry',
  imports: [TranslocoPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './search-entry.html',
})
export class SearchEntry {
  readonly commandId = input.required<string>();

  readonly testId = input.required<string>();

  private readonly commands = inject(CommandService);

  protected readonly compact = inject(BAR_CONTEXT, { optional: true })?.dock === 'bottom';

  protected readonly command = computed<Command | undefined>(() => {
    const id = this.commandId();
    const command = this.commands.commands().find((entry) => entry.id === id);
    return command && this.commands.available(command) ? command : undefined;
  });

  protected readonly shortcut = computed<string | undefined>(() =>
    this.commands.shortcutOf(this.command()),
  );

  protected open(): void {
    this.commands.execute(this.commandId());
  }
}
