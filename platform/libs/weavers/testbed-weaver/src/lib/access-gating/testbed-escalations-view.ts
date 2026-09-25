import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ENTRIES, Entry, formatWaitingTime } from '../entry-tabs/testbed-entries';

@Component({
  selector: 'lw-testbed-escalations-view',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [TranslocoPipe],
  templateUrl: './testbed-escalations-view.html',
})
export class TestbedEscalationsView {
  protected readonly escalated: readonly Entry[] = ENTRIES.filter(
    (entry) =>
      entry.status !== 'resolved' &&
      (entry.priority === 'urgent' || entry.priority === 'high'),
  );

  protected waiting(entry: Entry): string {
    return formatWaitingTime(entry.waitingMinutes);
  }
}
