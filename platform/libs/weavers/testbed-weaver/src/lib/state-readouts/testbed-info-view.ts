import { Component, WritableSignal, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { testbedScratch } from './testbed-scratch';
import { testbedSession } from './testbed-session';
import { testbedActiveContent } from './testbed-active-content';
import { ENTRIES } from '../entry-tabs/testbed-entries';

@Component({
  imports: [TranslocoPipe],
  selector: 'lw-testbed-info-view',
  templateUrl: './testbed-info-view.html',
})
export class TestbedInfoView {
  protected readonly session = testbedSession;

  protected readonly scratch = testbedScratch;

  protected readonly activeContent = testbedActiveContent;

  protected readonly facts: readonly [string, string][] = [
    [
      'testbed.info.assigned',
      String(ENTRIES.filter((entry) => entry.assignee === 'ada').length),
    ],
    [
      'testbed.info.resolved',
      String(ENTRIES.filter((entry) => entry.status === 'resolved').length),
    ],
    ['testbed.info.median', '14m'],
  ];

  protected readonly title = signal('');
  protected readonly due = signal('');
  protected readonly notes = signal('');
  protected readonly favorite = signal(false);
  protected readonly priorities = ['low', 'medium', 'high'] as const;
  protected readonly priority = signal<string>('medium');

  protected onScratch(event: Event): void {
    testbedScratch.write((event.target as HTMLInputElement).value);
  }

  protected onInput(target: WritableSignal<string>, event: Event): void {
    target.set((event.target as HTMLInputElement | HTMLTextAreaElement).value);
  }

  protected onCheck(target: WritableSignal<boolean>, event: Event): void {
    target.set((event.target as HTMLInputElement).checked);
  }
}
