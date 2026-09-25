import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ENTRIES } from '../entry-tabs/testbed-entries';

interface AssigneeLoad {
  readonly id: string;
  readonly name: string;
  readonly open: number;
  readonly percent: number;
}

const ASSIGNEES: readonly { id: string; name: string }[] = [
  { id: 'ada', name: 'Ada Lovelace' },
  { id: 'grace', name: 'Grace Hopper' },
];

@Component({
  selector: 'lw-testbed-admin-area-view',
  imports: [TranslocoPipe],
  templateUrl: './admin-area-view.html',
})
export class AdminAreaView {
  private readonly openTotal = ENTRIES.filter(
    (entry) => entry.status !== 'resolved',
  ).length;

  protected readonly assignees: readonly AssigneeLoad[] = ASSIGNEES.map((assignee) => {
    const open = ENTRIES.filter(
      (entry) => entry.assignee === assignee.id && entry.status !== 'resolved',
    ).length;
    return {
      ...assignee,
      open,
      percent: this.openTotal === 0 ? 0 : Math.round((open / this.openTotal) * 100),
    };
  });
}
