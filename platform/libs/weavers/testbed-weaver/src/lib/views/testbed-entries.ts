import { WritableSignal, signal } from '@angular/core';

export type EntryPriority = 'urgent' | 'high' | 'normal' | 'low';
export type EntryStatus = 'open' | 'waiting' | 'resolved';

export interface EntryMessage {
  readonly from: string;
  readonly fromOther: boolean;
  readonly minutesAgo: number;
}

export interface Entry {
  readonly id: string;
  readonly reference: string;
  readonly subject: string;
  readonly owner: string;
  readonly group: string;
  readonly priority: EntryPriority;
  readonly status: EntryStatus;
  readonly waitingMinutes: number;
  readonly assignee: string;
  readonly conversation: readonly EntryMessage[];
}

const drafts = new Map<string, WritableSignal<string>>();

export function entryDraft(id: string): WritableSignal<string> {
  let draft = drafts.get(id);
  if (!draft) {
    draft = signal('');
    drafts.set(id, draft);
  }
  return draft;
}

export function entryById(id: string): Entry | undefined {
  return ENTRIES.find((entry) => entry.id === id);
}

export const ENTRIES: readonly Entry[] = [
  {
    id: 'e-01',
    reference: 'E-01',
    subject: 'Alpha',
    owner: 'U1',
    group: 'G1',
    priority: 'urgent',
    status: 'open',
    waitingMinutes: 12,
    assignee: 'ada',
    conversation: [
      { from: 'U1', fromOther: true, minutesAgo: 46 },
      { from: 'Ada Lovelace', fromOther: false, minutesAgo: 31 },
      { from: 'U1', fromOther: true, minutesAgo: 12 },
    ],
  },
  {
    id: 'e-02',
    reference: 'E-02',
    subject: 'Bravo',
    owner: 'U2',
    group: 'G2',
    priority: 'high',
    status: 'open',
    waitingMinutes: 54,
    assignee: 'ada',
    conversation: [{ from: 'U2', fromOther: true, minutesAgo: 54 }],
  },
  {
    id: 'e-03',
    reference: 'E-03',
    subject: 'Charlie',
    owner: 'U3',
    group: 'G3',
    priority: 'high',
    status: 'waiting',
    waitingMinutes: 190,
    assignee: 'ada',
    conversation: [
      { from: 'U3', fromOther: true, minutesAgo: 320 },
      { from: 'Ada Lovelace', fromOther: false, minutesAgo: 190 },
    ],
  },
  {
    id: 'e-04',
    reference: 'E-04',
    subject: 'Delta',
    owner: 'U4',
    group: 'G4',
    priority: 'normal',
    status: 'open',
    waitingMinutes: 240,
    assignee: 'grace',
    conversation: [{ from: 'U4', fromOther: true, minutesAgo: 240 }],
  },
  {
    id: 'e-05',
    reference: 'E-05',
    subject: 'Echo',
    owner: 'U5',
    group: 'G5',
    priority: 'low',
    status: 'waiting',
    waitingMinutes: 1450,
    assignee: 'ada',
    conversation: [
      { from: 'U5', fromOther: true, minutesAgo: 1600 },
      { from: 'Ada Lovelace', fromOther: false, minutesAgo: 1450 },
    ],
  },
  {
    id: 'e-06',
    reference: 'E-06',
    subject: 'Foxtrot',
    owner: 'U6',
    group: 'G1',
    priority: 'normal',
    status: 'open',
    waitingMinutes: 320,
    assignee: 'grace',
    conversation: [{ from: 'U6', fromOther: true, minutesAgo: 320 }],
  },
  {
    id: 'e-07',
    reference: 'E-07',
    subject: 'Golf',
    owner: 'U7',
    group: 'G2',
    priority: 'normal',
    status: 'resolved',
    waitingMinutes: 2880,
    assignee: 'ada',
    conversation: [
      { from: 'U7', fromOther: true, minutesAgo: 3200 },
      { from: 'Ada Lovelace', fromOther: false, minutesAgo: 2880 },
    ],
  },
  {
    id: 'e-08',
    reference: 'E-08',
    subject: 'Hotel',
    owner: 'U8',
    group: 'G3',
    priority: 'low',
    status: 'resolved',
    waitingMinutes: 4320,
    assignee: 'grace',
    conversation: [
      { from: 'U8', fromOther: true, minutesAgo: 4600 },
      { from: 'Grace Hopper', fromOther: false, minutesAgo: 4320 },
    ],
  },
];
