import { Component } from '@angular/core';
import { PALETTE_COMMAND_ID } from '../command-palette';
import { SearchEntry } from './search-entry';

@Component({
  selector: 'lw-command-palette-entry',
  imports: [SearchEntry],
  template:
    '<lw-search-entry [commandId]="commandId" testId="command-palette-entry" />',
})
export class CommandPaletteEntry {
  protected readonly commandId = PALETTE_COMMAND_ID;
}
