import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ENTRIES, Entry, formatWaitingTime } from '../entry-tabs/testbed-entries';

@Component({
  selector: 'lw-testbed-admin-route-view',
  imports: [TranslocoPipe],
  templateUrl: './admin-route-view.html',
})
export class AdminRouteView {
  protected readonly escalated: readonly Entry[] = ENTRIES.filter(
    (entry) =>
      entry.status !== 'resolved' &&
      (entry.priority === 'urgent' || entry.priority === 'high'),
  );

  protected waiting(entry: Entry): string {
    return formatWaitingTime(entry.waitingMinutes);
  }
}
