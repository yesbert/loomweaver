import { WritableSignal, signal } from '@angular/core';

const drafts = new Map<string, WritableSignal<string>>();

export function entryDraft(id: string): WritableSignal<string> {
  let draft = drafts.get(id);
  if (!draft) {
    draft = signal('');
    drafts.set(id, draft);
  }
  return draft;
}
