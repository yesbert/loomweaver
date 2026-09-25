import { Component } from '@angular/core';
import { QUICK_OPEN_COMMAND_ID } from '../command-palette';
import { SearchEntry } from './search-entry';

@Component({
  selector: 'lw-quick-open-entry',
  imports: [SearchEntry],
  template: '<lw-search-entry [commandId]="commandId" />',
})
export class QuickOpenEntry {
  protected readonly commandId = QUICK_OPEN_COMMAND_ID;
}
