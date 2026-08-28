import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ENTRIES } from './testbed-entries';

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
  selector: 'lw-testbed-team-view',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [TranslocoPipe],
  templateUrl: './testbed-team-view.html',
})
export class TestbedTeamView {
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
