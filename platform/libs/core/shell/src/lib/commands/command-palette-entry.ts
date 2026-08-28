import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { BAR_CONTEXT } from '../regions/bar/bar-context';
import { CommandService } from './command.service';
import { PALETTE_COMMAND_ID } from './command-palette';

@Component({
  selector: 'lw-command-palette-entry',
  imports: [TranslocoPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './command-palette-entry.html',
})
export class CommandPaletteEntry {
  private readonly commands = inject(CommandService);

  protected readonly compact = inject(BAR_CONTEXT, { optional: true })?.dock === 'bottom';

  protected readonly shortcut = computed<string | undefined>(() =>
    this.commands.shortcutOf(
      this.commands.commands().find((entry) => entry.id === PALETTE_COMMAND_ID),
    ),
  );

  protected open(): void {
    this.commands.execute(PALETTE_COMMAND_ID);
  }
}
