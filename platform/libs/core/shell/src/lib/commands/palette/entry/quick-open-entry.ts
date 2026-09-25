import { Component } from '@angular/core';
import { QUICK_OPEN_COMMAND_ID } from '../command-palette';
import { SearchEntry } from './search-entry';

@Component({
  selector: 'lw-quick-open-entry',
  imports: [SearchEntry],
  template:
    '<lw-search-entry [commandId]="commandId" testId="quick-open-entry" />',
})
export class QuickOpenEntry {
  protected readonly commandId = QUICK_OPEN_COMMAND_ID;
}
