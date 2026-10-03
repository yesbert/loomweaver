import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { MenuContext } from '@loomweaver/plugin-sdk';
import { RECORDS_TOOLBAR } from './records-slot';

interface Record {
  readonly id: string;
  readonly kind: 'note' | 'task';
}

const RECORDS: readonly Record[] = [
  { id: 'r-1', kind: 'note' },
  { id: 'r-2', kind: 'task' },
  { id: 'r-3', kind: 'note' },
];

@Component({
  imports: [TranslocoPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  selector: 'lw-testbed-records-view',
  templateUrl: './testbed-records-view.html',
})
export class TestbedRecordsView {
  protected readonly slot = RECORDS_TOOLBAR;

  protected readonly records = RECORDS;

  protected contextOf(record: Record): MenuContext {
    return { record: record.id, kind: record.kind };
  }
}
